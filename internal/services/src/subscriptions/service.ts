import {
  type Database,
  type SQL,
  type TransactionDatabase,
  and,
  eq,
  inArray,
  sql,
} from "@unprice/db"
import {
  customerEntitlements,
  subscriptionItems,
  subscriptionPhases,
  subscriptions,
} from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type InsertSubscription,
  type InsertSubscriptionPhase,
  type InvoiceStatus,
  type Subscription,
  type SubscriptionItemConfig,
  type SubscriptionPhase,
  configureBillingCycleSubscription,
  createDefaultSubscriptionConfig,
} from "@unprice/db/validators"
import { Err, Ok, type Result, type SchemaError } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { getDay } from "date-fns"
import type { Cache } from "../cache"
import { CustomerService } from "../customers/service"
import type { Metrics } from "../metrics"
import { UnPriceSubscriptionError } from "./errors"
import { SubscriptionMachine } from "./machine"
import type { SusbriptionMachineStatus } from "./types"
import { collectInvoicePayment, finalizeInvoice } from "./utils"

export class SubscriptionService {
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly analytics: Analytics
  private readonly cache: Cache
  private readonly metrics: Metrics
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private readonly waitUntil: (promise: Promise<any>) => void
  private customerService: CustomerService

  constructor({
    db,
    logger,
    analytics,
    waitUntil,
    cache,
    metrics,
  }: {
    db: Database | TransactionDatabase
    logger: Logger
    analytics: Analytics
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    waitUntil: (promise: Promise<any>) => void
    cache: Cache
    metrics: Metrics
  }) {
    this.db = db
    this.logger = logger
    this.analytics = analytics
    this.cache = cache
    this.metrics = metrics
    this.waitUntil = waitUntil
    this.customerService = new CustomerService({
      db,
      logger,
      analytics,
      waitUntil,
      cache,
      metrics,
    })
  }

  // get the items for the phase and set the end date to the entitlements that are no longer valid
  private async setEndEntitlementsForPhase({
    phaseId,
    projectId,
    endAt,
    db,
  }: {
    phaseId: string
    projectId: string
    endAt: number | null
    db?: Database | TransactionDatabase
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the active phase for the subscription with the customer entitlements
    const phase = await (db ?? this.db).query.subscriptionPhases.findFirst({
      with: {
        items: true,
      },
      where: (phase, { eq, and }) => and(eq(phase.id, phaseId), eq(phase.projectId, projectId)),
    })

    if (!phase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase not found",
        })
      )
    }

    const { items } = phase

    const sqlChunks: SQL[] = []
    const ids: string[] = []
    sqlChunks.push(sql`(case`)

    for (const item of items) {
      sqlChunks.push(
        endAt === null
          ? sql`when ${customerEntitlements.subscriptionItemId} = ${item.id} then NULL`
          : sql`when ${customerEntitlements.subscriptionItemId} = ${item.id} then cast(${endAt} as bigint)`
      )
      ids.push(item.id)
    }

    sqlChunks.push(sql`end)`)
    const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "))

    await (db ?? this.db)
      .update(customerEntitlements)
      .set({ validTo: finalSql })
      .where(inArray(customerEntitlements.subscriptionItemId, ids))
      .catch((e) => {
        this.logger.error(e.message)
        throw new UnPriceSubscriptionError({
          message: `Error while updating customer entitlements: ${e.message}`,
        })
      })

    return Ok(undefined)
  }

  // create the entitlements for the new phase
  public async createEntitlementsForPhase({
    phaseId,
    projectId,
    customerId,
    db,
  }: {
    phaseId: string
    projectId: string
    customerId: string
    db?: Database | TransactionDatabase
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the active phase for the subscription with the customer entitlements
    const phase = await (db ?? this.db).query.subscriptionPhases.findFirst({
      with: {
        items: {
          with: {
            featurePlanVersion: {
              with: {
                feature: true,
              },
            },
          },
        },
      },
      where: (phase, { eq, and }) => and(eq(phase.id, phaseId), eq(phase.projectId, projectId)),
    })

    if (!phase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase not found",
        })
      )
    }

    const { items, ...phaseData } = phase

    await (db ?? this.db)
      .insert(customerEntitlements)
      .values(
        items.map((item) => ({
          id: newId("customer_entitlement"),
          projectId,
          customerId,
          subscriptionId: phaseData.subscriptionId,
          featurePlanVersionId: item.featurePlanVersionId,
          subscriptionItemId: item.id,
          units: item.units,
          usage: "0",
          accumulatedUsage: "0",
          // if there are defined units thats the limit
          limit: item.units ?? item.featurePlanVersion.limit,
          subscriptionPhaseId: phaseData.id,
          validFrom: phaseData.startAt,
          validTo: phaseData.endAt,
          resetedAt: Date.now(),
          active: true,
          isCustom: false,
          lastUsageUpdateAt: Date.now(),
        }))
      )
      .catch((e) => {
        this.logger.error(e.message)
        throw new UnPriceSubscriptionError({
          message: `Error while creating customer entitlements: ${e.message}`,
        })
      })

    return Ok(undefined)
  }
  // creating a phase is a 2 step process:
  // 1. validate the input
  // 2. validate the subscription exists
  // 3. validate there is no active phase in the same start - end range for the subscription
  // 4. validate the config items are valid and there is no active subscription item in the same features
  // 5. create the phase
  // 6. create the items
  // 7. create entitlements
  public async createPhase({
    input,
    projectId,
    db,
    now,
  }: {
    input: InsertSubscriptionPhase
    projectId: string
    db?: Database | TransactionDatabase
    now: number
  }): Promise<Result<SubscriptionPhase, UnPriceSubscriptionError | SchemaError>> {
    const {
      planVersionId,
      trialDays,
      metadata,
      config,
      paymentMethodId,
      startAt,
      endAt,
      subscriptionId,
    } = input

    const startAtToUse = startAt ?? now
    const endAtToUse = endAt ?? undefined

    // get subscription with phases from start date
    const subscriptionWithPhases = await (db ?? this.db).query.subscriptions.findFirst({
      where: (sub, { eq }) => eq(sub.id, subscriptionId),
      with: {
        phases: true,
      },
    })

    if (!subscriptionWithPhases) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found",
        })
      )
    }

    // don't allow to create phase when the subscription is not active
    if (!subscriptionWithPhases.active && subscriptionWithPhases.status !== "idle") {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is not active",
        })
      )
    }

    // order phases by startAt
    const orderedPhases = subscriptionWithPhases.phases.sort((a, b) => a.startAt - b.startAt)

    // active phase is the one where now is between startAt and endAt or endAt is undefined
    const activePhase = orderedPhases.find((phase) => {
      return startAtToUse >= phase.startAt && (phase.endAt ? startAtToUse <= phase.endAt : true)
    })

    if (activePhase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "There is already an active phase in the same date range",
        })
      )
    }

    // verify phases don't overlap
    // start date of the new phase is greater than the end date of the phase
    // end date could be undefined or null which mean the phase is open ended
    const overlappingPhases = orderedPhases.some((p) => {
      return startAtToUse <= (p.endAt ?? Number.POSITIVE_INFINITY)
    })

    if (overlappingPhases) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phases overlap, there is already a phase in the same range",
        })
      )
    }

    // phase have to be consecutive with one another starting from the end date of the previous phase
    const consecutivePhases = orderedPhases.every((p, index) => {
      const previousPhase = orderedPhases[index - 1]

      if (previousPhase) {
        if (previousPhase.endAt) {
          // every phase end we add 1 millisecond to the end date
          return previousPhase.endAt + 1 === p.startAt
        }
      }

      return true
    })

    if (!consecutivePhases) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phases are not consecutive",
        })
      )
    }

    const versionData = await (db ?? this.db).query.versions.findFirst({
      with: {
        planFeatures: {
          with: {
            feature: true,
          },
        },
        plan: true,
        project: true,
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, planVersionId),
          operators.eq(fields.projectId, projectId)
        )
      },
    })

    if (!versionData?.id) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Version not found. Please check the planVersionId",
        })
      )
    }

    if (versionData.status !== "published") {
      return Err(
        new UnPriceSubscriptionError({
          message: "Plan version is not published, only published versions can be subscribed to",
        })
      )
    }

    if (versionData.active !== true) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Plan version is not active, only active versions can be subscribed to",
        })
      )
    }

    if (!versionData.planFeatures || versionData.planFeatures.length === 0) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Plan version has no features",
        })
      )
    }

    // check if payment method is required for the plan version
    const paymentMethodRequired = versionData.paymentMethodRequired
    let trialDaysToUse = trialDays ?? versionData.trialDays ?? 0
    let billingAnchorToUse = versionData.billingConfig.billingAnchor
    const billingIntervalToUse = versionData.billingConfig.billingInterval

    // don't apply trials if the interval is not day, month or year
    if (!["year", "month", "day"].includes(billingIntervalToUse)) {
      trialDaysToUse = 0
      // don't apply billing anchor if the interval is not day, month or year
      billingAnchorToUse = 0
    }

    // calculate the day of creation of the subscription
    if (billingAnchorToUse === "dayOfCreation") {
      billingAnchorToUse = getDay(startAtToUse)
    }

    // validate payment method is required and if not provided
    if (paymentMethodRequired && (!paymentMethodId || paymentMethodId === "")) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Payment method is required for this plan version",
        })
      )
    }

    // check the subscription items configuration
    let configItemsSubscription: SubscriptionItemConfig[] = []

    if (!config) {
      // if no items are passed, configuration is created from the default quantities of the plan version
      const { err, val } = createDefaultSubscriptionConfig({
        planVersion: versionData,
      })

      if (err) {
        return Err(
          new UnPriceSubscriptionError({
            message: err.message,
          })
        )
      }

      configItemsSubscription = val
    } else {
      configItemsSubscription = config
    }

    // get the billing cycle for the subscription given the start date
    const calculatedBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: startAtToUse,
      trialDays: trialDaysToUse,
      billingConfig: {
        ...versionData.billingConfig,
        billingAnchor: billingAnchorToUse ?? 0,
      },
      endAt: endAtToUse ?? undefined,
      alignStartToDay: false,
      alignEndToDay: true,
      alignToCalendar: true,
    })

    const trialDaysEndAt = calculatedBillingCycle.trialEndsAtMs
      ? calculatedBillingCycle.trialEndsAtMs
      : undefined

    const result = await (db ?? this.db).transaction(async (trx) => {
      // create the subscription phase
      const phase = await trx
        .insert(subscriptionPhases)
        .values({
          id: newId("subscription_phase"),
          projectId,
          planVersionId,
          subscriptionId,
          paymentMethodId,
          trialEndsAt: trialDaysEndAt,
          trialDays: trialDaysToUse,
          startAt: startAtToUse,
          endAt: endAtToUse,
          metadata,
          billingAnchor: billingAnchorToUse ?? 0,
        })
        .returning()
        .catch((e) => {
          this.logger.error(e.message)
          throw e
        })
        .then((re) => re[0])

      if (!phase) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Error while creating subscription phase",
          })
        )
      }

      // add items to the subscription
      await Promise.all(
        // this is important because every item has the configuration of the quantity of a feature in the subscription
        configItemsSubscription.map((item) =>
          trx.insert(subscriptionItems).values({
            id: newId("subscription_item"),
            subscriptionPhaseId: phase.id,
            projectId: projectId,
            featurePlanVersionId: item.featurePlanId,
            units: item.units,
            subscriptionId,
          })
        )
      ).catch((e) => {
        this.logger.error(e.message)
        trx.rollback()
        throw e
      })

      // update the status of the subscription if the phase is active
      const isActivePhase =
        phase.startAt <= Date.now() && (phase.endAt ?? Number.POSITIVE_INFINITY) >= Date.now()

      if (isActivePhase) {
        // set the next invoice at the end of the trial or the end of the billing cycle
        const invoiceAt =
          trialDaysToUse > 0
            ? calculatedBillingCycle.cycleEndMs
            : versionData.whenToBill === "pay_in_advance"
              ? calculatedBillingCycle.cycleStartMs
              : calculatedBillingCycle.cycleEndMs

        await trx
          .update(subscriptions)
          .set({
            active: true,
            status: trialDaysToUse > 0 ? "trialing" : "active",
            // if there are trial days, we set the next invoice at to the end of the trial
            invoiceAt,
            planSlug: versionData.plan.slug,
            currentCycleStartAt: calculatedBillingCycle.cycleStartMs,
            currentCycleEndAt: calculatedBillingCycle.cycleEndMs,
            renewAt: invoiceAt + 1,
            endAt: endAtToUse ?? undefined,
          })
          .where(eq(subscriptions.id, subscriptionId))
      }

      // we set end date to the entitlements that are no longer valid
      // phases are ordered by startAt so we can get the previous phase
      const previousPhase = orderedPhases.find((p) => p.startAt < phase.startAt)

      if (previousPhase?.endAt) {
        const removeEntitlementsResult = await this.setEndEntitlementsForPhase({
          phaseId: previousPhase.id,
          projectId,
          endAt: previousPhase.endAt,
          db: trx,
        })

        if (removeEntitlementsResult.err) {
          this.logger.error(removeEntitlementsResult.err.message)
          trx.rollback()
          throw removeEntitlementsResult.err
        }
      }

      // we create the entitlements for the new phase
      const createEntitlementsResult = await this.createEntitlementsForPhase({
        phaseId: phase.id,
        projectId,
        customerId: subscriptionWithPhases.customerId,
        db: trx,
      })

      if (createEntitlementsResult.err) {
        this.logger.error(createEntitlementsResult.err.message)
        trx.rollback()
        throw createEntitlementsResult.err
      }

      return Ok(phase)
    })

    return result
  }

  public async removePhase({
    phaseId,
    projectId,
    now,
  }: {
    phaseId: string
    projectId: string
    now: number
  }): Promise<Result<boolean, UnPriceSubscriptionError | SchemaError>> {
    // only allow that are not active
    // and are not in the past
    const phase = await this.db.query.subscriptionPhases.findFirst({
      where: (phase, { eq, and }) => and(eq(phase.id, phaseId), eq(phase.projectId, projectId)),
    })

    if (!phase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase not found",
        })
      )
    }

    const isActivePhase = phase.startAt <= now && (phase.endAt ?? Number.POSITIVE_INFINITY) >= now
    const isInThePast = phase.startAt < now

    if (isActivePhase || isInThePast) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase is active or in the past, can't remove",
        })
      )
    }

    const result = await this.db.transaction(async (trx) => {
      // removing the phase will cascade to the subscription items and entitlements
      const subscriptionPhase = await trx
        .delete(subscriptionPhases)
        .where(and(eq(subscriptionPhases.id, phaseId), eq(subscriptionPhases.projectId, projectId)))
        .returning()
        .then((re) => re[0])

      if (!subscriptionPhase) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Error while removing subscription phase",
          })
        )
      }

      return Ok(true)
    })

    return result
  }

  public async updatePhase({
    input,
    subscriptionId,
    projectId,
    db,
    now,
  }: {
    input: SubscriptionPhase
    subscriptionId: string
    projectId: string
    db?: Database | TransactionDatabase
    now: number
  }): Promise<Result<SubscriptionPhase, UnPriceSubscriptionError | SchemaError>> {
    const { startAt, endAt, items } = input

    // get subscription with phases from start date
    const subscriptionWithPhases = await (db ?? this.db).query.subscriptions.findFirst({
      where: (sub, { eq }) => eq(sub.id, subscriptionId),
      with: {
        phases: {
          where: (phase, { gte }) => gte(phase.startAt, startAt),
        },
      },
    })

    if (!subscriptionWithPhases) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found",
        })
      )
    }

    if (!subscriptionWithPhases.active) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is not active",
        })
      )
    }

    // order phases by startAt
    const orderedPhases = subscriptionWithPhases.phases.sort((a, b) => a.startAt - b.startAt)

    const phaseToUpdate = orderedPhases.find((p) => p.id === input.id)

    if (!phaseToUpdate) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase not found",
        })
      )
    }

    // if this phase is active customer can't change the start date
    const isActivePhase =
      phaseToUpdate.startAt <= now && (phaseToUpdate.endAt ?? Number.POSITIVE_INFINITY) >= now

    if (isActivePhase && startAt !== phaseToUpdate.startAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: "The phase is active, you can't change the start date",
        })
      )
    }

    // verify phases don't overlap result the phases that overlap
    const overlappingPhases = orderedPhases.filter((p) => {
      const startAtPhase = p.startAt
      const endAtPhase = p.endAt ?? Number.POSITIVE_INFINITY

      return (
        (startAtPhase < endAt! || startAtPhase === endAt!) &&
        (endAtPhase > startAt || endAtPhase === startAt)
      )
    })

    if (overlappingPhases.length > 0 && overlappingPhases.some((p) => p.id !== phaseToUpdate.id)) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phases overlap, there is already a phase in the same range",
        })
      )
    }

    // check if the phases are consecutive with one another starting from the end date of the previous phase
    // the phase that the customer is updating need to be check with the new dates
    const consecutivePhases = orderedPhases.filter((p, index) => {
      let phaseToCheck = p
      if (p.id === phaseToUpdate.id) {
        phaseToCheck = {
          ...p,
          startAt,
          endAt,
        }
      }

      if (index === 0) {
        return true
      }

      const previousPhase = orderedPhases[index - 1]
      return previousPhase ? previousPhase.endAt === phaseToCheck.startAt + 1 : false
    })

    if (consecutivePhases.length !== orderedPhases.length) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phases are not consecutive",
        })
      )
    }

    // validate the the end date is not less that the end date of the current billing cycle

    const currentCycleEndAt = subscriptionWithPhases.currentCycleEndAt

    if (endAt && endAt < currentCycleEndAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: "The end date is less than the current billing cycle end date",
        })
      )
    }

    const result = await (db ?? this.db).transaction(async (trx) => {
      // create the subscription phase
      const subscriptionPhase = await trx
        .update(subscriptionPhases)
        .set({
          startAt: startAt,
          endAt: endAt ?? null,
        })
        .where(eq(subscriptionPhases.id, input.id))
        .returning()
        .then((re) => re[0])

      if (!subscriptionPhase) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Error while updating subscription phase",
          })
        )
      }

      // add items to the subscription
      if (items?.length) {
        await Promise.all(
          // this is important because every item has the configuration of the quantity of a feature in the subscription
          items.map((item) =>
            trx
              .update(subscriptionItems)
              .set({
                units: item.units,
              })
              .where(eq(subscriptionItems.id, item.id))
          )
        ).catch((e) => {
          this.logger.error("Error inserting subscription items", {
            error: JSON.stringify(e),
          })
          trx.rollback()
          throw e
        })
      }

      // update the status of the subscription if the phase is active
      const isActivePhase =
        subscriptionPhase.startAt <= Date.now() &&
        (subscriptionPhase.endAt ?? Number.POSITIVE_INFINITY) >= Date.now()

      if (isActivePhase) {
        await trx
          .update(subscriptions)
          .set({
            renewAt: endAt ? endAt + 1 : undefined,
          })
          .where(eq(subscriptions.id, subscriptionId))
      }

      // set the new end date for the entitlements
      const setEndEntitlementsResult = await this.setEndEntitlementsForPhase({
        phaseId: subscriptionPhase.id,
        projectId,
        endAt: endAt,
        db: trx,
      })

      if (setEndEntitlementsResult.err) {
        trx.rollback()
        throw setEndEntitlementsResult.err
      }

      return Ok(subscriptionPhase)
    })

    return result
  }

  // creating a subscription is a 4 step process:
  // 1. validate the input
  // 2. validate the customer exists
  // 3. create the subscription
  // 4. create the phases
  public async createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError | SchemaError>> {
    const { customerId, phases, metadata, timezone } = input

    const customerData = await this.db.query.customers.findFirst({
      with: {
        subscriptions: {
          // get active subscriptions of the customer
          where: (sub, { eq }) => eq(sub.active, true),
        },
        project: true,
      },
      where: (customer, operators) =>
        operators.and(
          operators.eq(customer.id, customerId),
          operators.eq(customer.projectId, projectId)
        ),
    })

    if (!customerData?.id) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Customer not found. Please check the customerId",
        })
      )
    }

    // if customer is not active, throw an error
    if (!customerData.active) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Customer is not active, please contact support",
        })
      )
    }

    // IMPORTANT: for now we only allow one subscription per customer
    if (customerData.subscriptions.length > 0) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "Customer already has a subscription, add a new phase to the existing subscription if you want to apply a change",
        })
      )
    }

    // project defaults
    const timezoneToUse = timezone || customerData.project.timezone

    // execute this in a transaction
    const result = await this.db.transaction(async (trx) => {
      try {
        // create the subscription
        const subscriptionId = newId("subscription")

        // create the subscription and then phases
        const newSubscription = await trx
          .insert(subscriptions)
          .values({
            id: subscriptionId,
            projectId,
            customerId: customerData.id,
            active: false,
            status: "idle",
            timezone: timezoneToUse,
            metadata: metadata,
            // provisional values
            invoiceAt: Date.now(),
            currentCycleStartAt: Date.now(),
            currentCycleEndAt: Date.now(),
          })
          .returning()
          .then((re) => re[0])
          .catch((e) => {
            this.logger.error(e.message)
            trx.rollback()
            return null
          })

        if (!newSubscription) {
          return Err(
            new UnPriceSubscriptionError({
              message: "Error while creating subscription",
            })
          )
        }

        // create the phases
        const phasesResult = await Promise.all(
          phases.map((phase) =>
            this.createPhase({
              input: {
                ...phase,
                subscriptionId: newSubscription.id,
                customerId: customerData.id,
                paymentMethodRequired: phase.paymentMethodRequired ?? false,
              },
              projectId,
              db: trx,
              now: Date.now(),
            })
          )
        )

        const phaseErr = phasesResult.find((r) => r.err)

        // if there is an error, rollback the transaction and throw the error
        if (phaseErr?.err) {
          this.logger.error(`Error creating subscription phase ${phaseErr?.err?.message}`)

          trx.rollback()
          return Err(phaseErr.err)
        }

        return Ok(newSubscription)
      } catch (e) {
        this.logger.error("Error creating subscription", {
          error: JSON.stringify(e),
        })

        trx.rollback()
        throw e
      }
    })

    if (result.err) {
      return Err(result.err)
    }

    const subscription = result.val

    return Ok(subscription)
  }

  public async endTrial({
    subscriptionId,
    projectId,
    now = Date.now(),
  }: {
    subscriptionId: string
    projectId: string
    now?: number
  }): Promise<Result<{ status: SusbriptionMachineStatus }, UnPriceSubscriptionError>> {
    const { err, val: machine } = await SubscriptionMachine.create({
      subscriptionId,
      projectId,
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.waitUntil,
      now,
    })

    if (err) {
      return Err(err)
    }

    const currentState = machine.getState()

    switch (currentState) {
      case "trialing":
      case "ending_trial": {
        const { err: errEndTrial } = await machine.endTrial()
        if (errEndTrial) {
          return Err(errEndTrial)
        }

        const { err: errRenew, val: resultRenew } = await machine.renew()
        if (errRenew) {
          return Err(errRenew)
        }

        await machine.shutdown()

        return Ok({
          status: resultRenew,
        })
      }
      case "renewing":
      case "past_due":
      case "invoiced": {
        const { err: errRenew, val: resultRenew } = await machine.renew()
        if (errRenew) {
          return Err(errRenew)
        }

        await machine.shutdown()

        return Ok({
          status: resultRenew,
        })
      }
      default:
        return Err(
          new UnPriceSubscriptionError({
            message: "Subscription is not in a valid state or not found",
          })
        )
    }
  }

  public async billingInvoice({
    invoiceId,
    projectId,
    subscriptionId,
    now = Date.now(),
  }: {
    invoiceId: string
    projectId: string
    subscriptionId: string
    now?: number
  }): Promise<
    Result<
      {
        total: number
        status: InvoiceStatus
      },
      UnPriceSubscriptionError
    >
  > {
    const { err, val: machine } = await SubscriptionMachine.create({
      now,
      subscriptionId,
      projectId,
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.waitUntil,
    })

    if (err) {
      return Err(err)
    }

    // lets try to finalize the invoice
    const { err: errCollectInvoicePayment, val: resultCollectInvoicePayment } =
      await collectInvoicePayment({
        invoiceId,
        projectId,
        logger: this.logger,
        now,
      })

    if (errCollectInvoicePayment) {
      // report fail to machine
      await machine.reportInvoiceFailure({
        invoiceId,
        error: errCollectInvoicePayment.message,
      })
      // shutdown the machine
      await machine.shutdown()
      return Err(errCollectInvoicePayment)
    }

    const invoiceStatus = resultCollectInvoicePayment.invoice.status

    switch (invoiceStatus) {
      case "paid":
      case "void":
        // report payment success to machine
        await machine.reportPaymentSuccess({
          invoiceId,
        })
        break
      case "failed":
        // report payment failure to machine
        await machine.reportPaymentFailure({
          invoiceId,
          error: "Payment failed",
        })
        break
      // don't do anything if the invoice is not paid
      default:
        break
    }

    // shutdown the machine
    await machine.shutdown()

    return Ok({
      total: resultCollectInvoicePayment.invoice.total,
      status: resultCollectInvoicePayment.invoice.status,
    })
  }

  public async finalizeInvoice({
    invoiceId,
    projectId,
    subscriptionId,
    now = Date.now(),
  }: {
    invoiceId: string
    projectId: string
    subscriptionId: string
    now?: number
  }): Promise<
    Result<
      {
        total: number
        status: InvoiceStatus
      },
      UnPriceSubscriptionError
    >
  > {
    const { err, val: machine } = await SubscriptionMachine.create({
      now,
      subscriptionId,
      projectId,
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.waitUntil,
    })

    if (err) {
      return Err(err)
    }

    // lets try to finalize the invoice
    const { err: errFinalizeInvoice, val: resultFinalizeInvoice } = await finalizeInvoice({
      invoiceId,
      projectId,
      logger: this.logger,
      now,
      analytics: this.analytics,
    })

    if (errFinalizeInvoice) {
      // report fail to machine
      await machine.reportInvoiceFailure({
        invoiceId,
        error: errFinalizeInvoice.message,
      })
      // shutdown the machine
      await machine.shutdown()
      return Err(errFinalizeInvoice)
    }

    // report success to machine
    await machine.reportInvoiceSuccess({
      invoiceId,
    })

    // shutdown the machine
    await machine.shutdown()

    return Ok({
      total: resultFinalizeInvoice.invoice.total,
      status: resultFinalizeInvoice.invoice.status,
    })
  }

  public async invoiceSubscription({
    subscriptionId,
    projectId,
    now = Date.now(),
  }: {
    subscriptionId: string
    projectId: string
    now?: number
  }): Promise<
    Result<
      {
        status: SusbriptionMachineStatus
      },
      UnPriceSubscriptionError
    >
  > {
    const { err, val: machine } = await SubscriptionMachine.create({
      now,
      subscriptionId,
      projectId,
      logger: this.logger,
      analytics: this.analytics,
      waitUntil: this.waitUntil,
    })

    if (err) {
      return Err(err)
    }

    const currentState = machine.getState()

    switch (currentState) {
      case "active":
      case "renewing":
      case "past_due": {
        const { err: errInvoice } = await machine.invoice()
        if (errInvoice) {
          return Err(errInvoice)
        }

        const { err: errRenew, val: resultRenew } = await machine.renew()
        if (errRenew) {
          return Err(errRenew)
        }

        await machine.shutdown()

        return Ok({
          status: resultRenew,
        })
      }
      case "invoiced": {
        const { err: errRenew, val: resultRenew } = await machine.renew()
        if (errRenew) {
          return Err(errRenew)
        }

        await machine.shutdown()

        return Ok({
          status: resultRenew,
        })
      }
      default:
        return Err(
          new UnPriceSubscriptionError({
            message: "Subscription is not in a valid state or not found",
          })
        )
    }
  }
}
