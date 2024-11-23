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
  type Customer,
  type CustomerEntitlement,
  type InsertSubscription,
  type InsertSubscriptionPhase,
  type PhaseStatus,
  type Subscription,
  type SubscriptionItemConfig,
  type SubscriptionItemExtended,
  type SubscriptionPhase,
  type SubscriptionPhaseExtended,
  type SubscriptionPhaseMetadata,
  createDefaultSubscriptionConfig,
  subscriptionInsertSchema,
  subscriptionPhaseInsertSchema,
} from "@unprice/db/validators"

import { Err, Ok, type Result, SchemaError } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "../cache/service"
import { CustomerService } from "../customers/service"
import { UnPriceMachineError } from "../machine/errors"
import type { Metrics } from "../metrics"
import { configureBillingCycleSubscription } from "./billing"
import { UnPriceSubscriptionError } from "./errors"
import { InvoiceStateMachine } from "./invoice-machine"
import { PhaseMachine } from "./phase-machine"

export class SubscriptionService {
  private readonly db: Database | TransactionDatabase
  private readonly cache: Cache | undefined
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly waitUntil: (p: Promise<unknown>) => void
  private readonly analytics: Analytics
  // map of phase id to phase machine
  private readonly phases: Map<string, SubscriptionPhaseExtended> = new Map()
  private subscription: Subscription | undefined
  private customer: Customer | undefined
  private initialized = false

  constructor({
    db,
    cache,
    metrics,
    logger,
    waitUntil,
    analytics,
  }: {
    db: Database | TransactionDatabase
    cache: Cache | undefined
    metrics: Metrics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
    analytics: Analytics
  }) {
    this.db = db
    this.cache = cache
    this.metrics = metrics
    this.logger = logger
    this.waitUntil = waitUntil
    this.analytics = analytics
  }

  public async initPhaseMachines({
    subscriptionId,
    projectId,
    db,
  }: {
    subscriptionId: string
    projectId: string
    db?: Database | TransactionDatabase
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the active phases for the subscription
    const subscription = await (db ?? this.db).query.subscriptions.findFirst({
      with: {
        phases: {
          with: {
            subscription: {
              with: {
                customer: true,
              },
            },
            items: {
              with: {
                featurePlanVersion: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
            planVersion: {
              with: {
                planFeatures: true,
              },
            },
          },
        },
        customer: true,
      },

      where: (sub, { eq, and }) => and(eq(sub.id, subscriptionId), eq(sub.projectId, projectId)),
    })

    if (!subscription) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found",
        })
      )
    }

    if (subscription.phases.length === 0) {
      return Ok(undefined)
    }

    const { phases, customer, ...rest } = subscription

    for (const phase of phases) {
      this.phases.set(phase.id, phase)
    }

    // save the rest of the subscription
    this.subscription = rest
    this.customer = customer
    this.initialized = true

    return Ok(undefined)
  }

  // entitlements are the actual features that are assigned to a customer
  // sync the entitlements with the subscription items, meaning end entitlements or revoke them
  // given the new phases.
  // 1. get the active items for the subscription (paid ones)
  // 2. get the current entitlements for the customer
  // 3. compare the active items with the entitlements for the current phase
  // 4. if there is a difference, create a new entitlement, deactivate the old ones or update the units
  // 5. for custom entitlements we don't do anything, they are already synced
  private async syncEntitlementsForSubscription({
    subscriptionId,
    projectId,
    customerId,
    now,
    db,
  }: {
    subscriptionId: string
    projectId: string
    customerId: string
    now: number
    db?: Database | TransactionDatabase
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the active phase for the subscription
    const subscription = await (db ?? this.db).query.subscriptions.findFirst({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte, isNull, or }) =>
            and(
              eq(phase.active, true),
              lte(phase.startAt, now),
              or(isNull(phase.endAt), gte(phase.endAt, now)),
              eq(phase.projectId, projectId)
            ),
          // phases are don't overlap, so we can use limit 1
          limit: 1,
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
        },
      },
      where: (sub, { eq, and }) => and(eq(sub.id, subscriptionId), eq(sub.projectId, projectId)),
    })

    const customerService = new CustomerService({
      cache: this.cache,
      db: db ?? this.db,
      metrics: this.metrics,
      logger: this.logger,
      waitUntil: this.waitUntil,
      analytics: this.analytics,
    })

    // get all the active entitlements for the customer
    const { err, val } = await customerService.getEntitlementsByDate({
      customerId,
      projectId,
      // get the entitlements for the given date
      now,
      // we don't want to cache the entitlements here, because we want to get the latest ones
      noCache: true,
      // custom entitlements are not synced with the subscription items
      includeCustom: false,
    })

    if (err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting entitlements: ${err.message}`,
        })
      )
    }

    const activeEntitlements = val
    const activePhase = subscription?.phases[0]
    const activeSubItems = activePhase?.items ?? []

    const activeSubItemsMap = new Map<string, SubscriptionItemExtended>()
    const entitlementsMap = new Map<
      string,
      Omit<CustomerEntitlement, "createdAtM" | "updatedAtM">
    >()

    for (const item of activeSubItems) {
      activeSubItemsMap.set(item.featurePlanVersionId, item)
    }

    for (const entitlement of activeEntitlements) {
      entitlementsMap.set(entitlement.featurePlanVersionId, entitlement)
    }

    // get the items that are not in the entitlements and create them
    // get the entitlements that are not in the items and deactivate them
    // update the lastUsageUpdateAt of the entitlements
    const entitiesToCreate: (typeof customerEntitlements.$inferInsert)[] = []
    const entitiesToDeactivate: Pick<typeof customerEntitlements.$inferInsert, "id" | "endAt">[] =
      []
    const entitiesToUpdate: Pick<
      typeof customerEntitlements.$inferInsert,
      "id" | "lastUsageUpdateAt" | "updatedAtM"
    >[] = []

    const sqlChunks: SQL[] = []

    // IMPORTANT: A customer can't have the same feature plan version assigned to multiple entitlements
    // Find items to create
    for (const [featurePlanVersionId, item] of activeSubItemsMap) {
      if (!entitlementsMap.has(featurePlanVersionId)) {
        entitiesToCreate.push({
          id: newId("customer_entitlement"),
          projectId,
          customerId,
          subscriptionItemId: item.id,
          featurePlanVersionId,
          units: item.units,
          limit: item.featurePlanVersion.limit,
          usage: 0, // Initialize usage to 0
          featureSlug: item.featurePlanVersion.feature.slug,
          featureType: item.featurePlanVersion.featureType,
          aggregationMethod: item.featurePlanVersion.aggregationMethod,
          realtime: item.featurePlanVersion.metadata?.realtime ?? false,
          type: "feature",
          startAt: now,
          endAt: activePhase?.endAt ?? null,
          isCustom: false,
        })
      }
    }

    // Find entitlements to deactivate or update
    for (const [featurePlanVersionId, entitlement] of entitlementsMap) {
      if (!activeSubItemsMap.has(featurePlanVersionId)) {
        entitiesToDeactivate.push({
          id: entitlement.id,
        })
      } else {
        sqlChunks.push(
          sql`when ${customerEntitlements.id} = ${entitlement.id} then ${
            activeSubItemsMap.get(featurePlanVersionId)?.units ?? null
          }`
        )
        entitiesToUpdate.push({
          id: entitlement.id,
        })
      }
    }

    sqlChunks.push(sql`end`)

    // Perform database operations
    await (db ?? this.db).transaction(async (tx) => {
      try {
        if (entitiesToCreate.length > 0) {
          await tx
            .insert(customerEntitlements)
            .values(entitiesToCreate as (typeof customerEntitlements.$inferInsert)[])
        }

        if (entitiesToDeactivate.length > 0) {
          await tx
            .update(customerEntitlements)
            .set({ endAt: now, updatedAtM: now })
            .where(
              and(
                inArray(
                  customerEntitlements.id,
                  entitiesToDeactivate.map((e) => e.id)
                ),
                eq(customerEntitlements.projectId, projectId)
              )
            )
        }

        if (entitiesToUpdate.length > 0) {
          const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "))

          await tx
            .update(customerEntitlements)
            .set({ units: finalSql, updatedAtM: now })
            .where(
              and(
                inArray(
                  customerEntitlements.id,
                  entitiesToUpdate.map((e) => e.id)
                ),
                eq(customerEntitlements.projectId, projectId)
              )
            )
        }
      } catch (err) {
        console.error(err)
        tx.rollback()
        throw err
      }
    })

    return Ok(undefined)
  }

  public async getActivePhaseMachine({
    now,
  }: {
    now: number
  }): Promise<Result<PhaseMachine, UnPriceSubscriptionError>> {
    if (!this.initialized) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription phases not initialized, execute initPhaseMachines first",
        })
      )
    }

    // active phase is the one where now is between startAt and endAt
    const activePhase = Array.from(this.phases.values()).find((phase) => {
      return now >= phase.startAt && (phase.endAt ? now <= phase.endAt : true)
    })

    if (!activePhase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "No active phase found",
        })
      )
    }

    if (!this.subscription || !this.customer) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription or customer not found",
        })
      )
    }

    const activePhaseMachine = new PhaseMachine({
      db: this.db,
      phase: activePhase,
      subscription: this.subscription,
      customer: this.customer,
      logger: this.logger,
      analytics: this.analytics,
    })

    return Ok(activePhaseMachine)
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
    subscriptionId,
    projectId,
    db,
    now,
  }: {
    input: InsertSubscriptionPhase
    subscriptionId: string
    projectId: string
    db?: Database | TransactionDatabase
    now: number
  }): Promise<Result<SubscriptionPhase, UnPriceSubscriptionError | SchemaError>> {
    const { success, data, error } = subscriptionPhaseInsertSchema.safeParse(input)

    if (!success) {
      return Err(SchemaError.fromZod(error, input))
    }

    const {
      planVersionId,
      trialDays,
      collectionMethod,
      startCycle,
      whenToBill,
      autoRenew,
      gracePeriod,
      metadata,
      config,
      paymentMethodId,
      startAt,
      endAt,
      dueBehaviour,
    } = data

    const startAtToUse = startAt ?? Date.now()
    let endAtToUse = endAt ?? null

    // get subscription with phases from start date
    const subscriptionWithPhases = await (db ?? this.db).query.subscriptions.findFirst({
      where: (sub, { eq }) => eq(sub.id, subscriptionId),
      with: {
        phases: {
          where: (phase, { gte }) => gte(phase.startAt, startAtToUse),
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

    // order phases by startAt
    const orderedPhases = subscriptionWithPhases.phases.sort((a, b) => a.startAt - b.startAt)

    // active phase is the one where now is between startAt and endAt
    const activePhase = orderedPhases.find((phase) => {
      return now >= phase.startAt && (phase.endAt ? now <= phase.endAt : true)
    })

    if (activePhase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "There is already an active phase in the same date range",
        })
      )
    }

    // verify phases don't overlap
    const overlappingPhases = orderedPhases.filter((p) => {
      const startAtPhase = p.startAt
      const endAtPhase = p.endAt ?? Number.POSITIVE_INFINITY

      const endAtNewPhase = endAtToUse ?? Number.POSITIVE_INFINITY

      return (
        (startAtPhase < endAtNewPhase || startAtPhase === endAtNewPhase) &&
        (endAtPhase > startAtToUse || endAtPhase === startAtToUse)
      )
    })

    if (overlappingPhases.length > 0) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phases overlap, there is already a phase in the same range",
        })
      )
    }

    // phase have to be consecutive with one another starting from the end date of the previous phase
    const consecutivePhases = orderedPhases.filter((p, index) => {
      const previousPhase = orderedPhases[index - 1]
      return previousPhase ? previousPhase.endAt === p.startAt : false
    })

    if (consecutivePhases.length !== orderedPhases.length) {
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

    // if the customer has a default payment method, we use that
    // TODO: here it could be a problem, if the user sends a wrong payment method id, we will use the customer default payment method
    // for now just accept the default payment method is equal to the customer default payment method
    // but probably the best approach would be to use the payment method directly from the customer and don't have a default payment method in the subscription

    // check if payment method is required for the plan version
    const paymentMethodRequired = versionData.paymentMethodRequired
    const trialDaysToUse = trialDays ?? versionData.trialDays ?? 0

    // validate payment method if there is no trails
    if (trialDaysToUse === 0) {
      if (paymentMethodRequired && !paymentMethodId) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Payment method is required for this plan version",
          })
        )
      }
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

    // override the timezone with the project timezone and other defaults with the plan version data
    // only used for ui purposes all date are saved in utc
    const billingPeriod = versionData.billingPeriod ?? "month"
    const whenToBillToUse = whenToBill ?? versionData.whenToBill
    const collectionMethodToUse = collectionMethod ?? versionData.collectionMethod
    const startCycleToUse = startCycle ?? versionData.startCycle ?? 1

    // get the billing cycle for the subscription given the start date
    const calculatedBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: startAtToUse,
      trialDays: trialDaysToUse,
      billingCycleStart: startCycleToUse,
      billingPeriod,
    })

    // if not auto renew we set end at to the end of the phase
    const autoRenewToUse = autoRenew ?? versionData.autoRenew ?? true

    if (!autoRenewToUse) {
      endAtToUse = calculatedBillingCycle.cycleEnd.getTime()
    }

    // calculate the next billing at given the when to bill
    const nextInvoiceAtToUse =
      whenToBillToUse === "pay_in_advance"
        ? calculatedBillingCycle.cycleStart.getTime()
        : calculatedBillingCycle.cycleEnd.getTime()

    const trialDaysEndAt = calculatedBillingCycle.trialDaysEndAt
      ? calculatedBillingCycle.trialDaysEndAt.getTime()
      : undefined

    const result = await (db ?? this.db).transaction(async (trx) => {
      // create the subscription phase
      const subscriptionPhase = await trx
        .insert(subscriptionPhases)
        .values({
          id: newId("subscription_phase"),
          projectId,
          planVersionId,
          subscriptionId,
          paymentMethodId,
          status: trialDaysToUse > 0 ? "trialing" : "active",
          trialEndsAt: trialDaysEndAt,
          trialDays: trialDaysToUse,
          startAt: startAtToUse,
          endAt: endAtToUse,
          collectionMethod: collectionMethodToUse,
          startCycle: startCycleToUse,
          dueBehaviour: dueBehaviour,
          whenToBill: whenToBillToUse,
          autoRenew: autoRenewToUse,
          gracePeriod,
          metadata,
        })
        .returning()
        .then((re) => re[0])

      if (!subscriptionPhase) {
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
            subscriptionPhaseId: subscriptionPhase.id,
            projectId: projectId,
            featurePlanVersionId: item.featurePlanId,
            units: item.units,
          })
        )
      ).catch((e) => {
        console.error(e)
        trx.rollback()
        throw e
      })

      // update the status of the subscription if the phase is active
      const isActivePhase =
        subscriptionPhase.startAt <= Date.now() &&
        (subscriptionPhase.endAt ?? Number.POSITIVE_INFINITY) >= Date.now()

      if (isActivePhase) {
        await trx
          .update(subscriptions)
          .set({
            active: true,
            // if there are trial days, we set the next invoice at to the end of the trial
            nextInvoiceAt:
              trialDaysToUse > 0 ? calculatedBillingCycle.cycleEnd.getTime() : nextInvoiceAtToUse,
            planSlug: versionData.plan.slug,
            currentCycleStartAt: calculatedBillingCycle.cycleStart.getTime(),
            currentCycleEndAt: calculatedBillingCycle.cycleEnd.getTime(),
            // if there is an end date, we set the expiration date
            expiresAt: endAtToUse,
          })
          .where(eq(subscriptions.id, subscriptionId))
      }

      // every time there is a new phase, we sync entitlements
      const syncEntitlementsResult = await this.syncEntitlementsForSubscription({
        projectId,
        customerId: subscriptionWithPhases.customerId,
        // we sync entitlements for the start date of the new phase
        // this will calculate the new entitlements for the phase
        // and add the end date to the entitlements that are no longer valid
        now: startAtToUse,
        db: trx,
        subscriptionId,
      })

      if (syncEntitlementsResult.err) {
        console.error(syncEntitlementsResult.err)
        trx.rollback()
        throw syncEntitlementsResult.err
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
    const { success, data, error } = subscriptionInsertSchema.safeParse(input)

    if (!success) {
      return Err(SchemaError.fromZod(error, input))
    }

    const { customerId, phases, metadata, timezone } = data

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
            "Customer already has a subscription, add a new phase to the existing subscription if you want to change the plan",
        })
      )
    }

    // project defaults
    const timezoneToUse = timezone || customerData.project.timezone

    // execute this in a transaction
    const result = await this.db.transaction(async (trx) => {
      // create the subscription
      const subscriptionId = newId("subscription")

      try {
        // create the subscription and then phases
        const newSubscription = await trx
          .insert(subscriptions)
          .values({
            id: subscriptionId,
            projectId,
            customerId: customerData.id,
            // create as pending, only when the first phase is created the subscription is active
            active: false,
            timezone: timezoneToUse,
            metadata: metadata,
            // provisional values
            nextInvoiceAt: Date.now(),
            currentCycleStartAt: Date.now(),
            currentCycleEndAt: Date.now(),
          })
          .returning()
          .then((re) => re[0])
          .catch((e) => {
            console.error(e)
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
              input: phase,
              projectId,
              subscriptionId: newSubscription.id,
              now: Date.now(),
              db: trx,
            })
          )
        ).catch((e) => {
          this.logger.error("Error creating subscription phases", {
            error: JSON.stringify(e),
          })

          trx.rollback()
          throw e
        })

        if (phasesResult.some((r) => r.err)) {
          trx.rollback()
          return Err(
            new UnPriceSubscriptionError({
              message: `Error while creating subscription phases: ${phasesResult
                .map((r) => r.err?.message)
                .join(", ")}`,
            })
          )
        }

        return Ok(newSubscription)
      } catch (e) {
        console.error(e)
        trx.rollback()
        throw e
      }
    })

    if (result.err) {
      return Err(result.err)
    }

    const customerService = new CustomerService({
      cache: this.cache,
      db: this.db,
      analytics: this.analytics,
      logger: this.logger,
      metrics: this.metrics,
      waitUntil: this.waitUntil,
    })

    // once the subscription is created, we can update the cache
    this.waitUntil(
      customerService.updateCacheAllCustomerEntitlementsByDate({
        customerId,
        projectId,
        now: Date.now(),
      })
    )

    const subscription = result.val

    return Ok(subscription)
  }

  public async renewSubscription(payload: { now: number }): Promise<
    Result<{ phaseStatus: PhaseStatus; activePhaseId: string }, UnPriceSubscriptionError>
  > {
    const { now } = payload
    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const activePhase = activePhaseMachine.getPhase()

    const { err: renewErr, val: renew } = await activePhaseMachine.transition("RENEW", {
      now,
    })

    if (renewErr) {
      return Err(renewErr)
    }

    return Ok({
      phaseStatus: renew.status,
      activePhaseId: activePhase.id,
    })
  }

  // apply a change to the subscription, the new subscription phase should be created
  public async expireSubscription(payload: {
    expiresAt?: number
    now: number
    metadata?: SubscriptionPhaseMetadata
  }): Promise<Result<{ status: PhaseStatus }, UnPriceSubscriptionError>> {
    const { expiresAt, now, metadata } = payload

    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const { err: expireErr, val: expire } = await activePhaseMachine.transition("EXPIRE", {
      expiresAt,
      now,
      metadata,
    })

    if (expireErr) {
      return Err(expireErr)
    }

    return Ok({
      status: expire.status,
    })
  }

  public async invoiceSubscription(payload: { now: number }): Promise<
    Result<
      { invoiceId: string; phaseStatus: PhaseStatus; activePhaseId: string },
      UnPriceSubscriptionError
    >
  > {
    const { now } = payload

    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const activePhase = activePhaseMachine.getPhase()

    const { err: invoiceErr, val: invoiceResult } = await activePhaseMachine.transition("INVOICE", {
      now,
    })

    if (invoiceErr) {
      return Err(invoiceErr)
    }

    return Ok({
      invoiceId: invoiceResult.invoice.id,
      phaseStatus: invoiceResult.status,
      activePhaseId: activePhase.id,
    })
  }

  // apply a change to the subscription, the new subscription phase should be created
  public async cancelSubscription(payload: {
    cancelAt?: number
    now: number
    metadata?: SubscriptionPhaseMetadata
  }): Promise<
    Result<{ phaseStatus: PhaseStatus; activePhaseId: string }, UnPriceSubscriptionError>
  > {
    const { cancelAt, now, metadata } = payload

    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const activePhase = activePhaseMachine.getPhase()

    const { err: cancelErr, val: cancel } = await activePhaseMachine.transition("CANCEL", {
      cancelAt,
      now,
      metadata,
    })

    if (cancelErr) {
      return Err(cancelErr)
    }

    return Ok({
      phaseStatus: cancel.status,
      activePhaseId: activePhase.id,
    })
  }

  // when an invoice is past due we need to mark the subscription as past due
  public async pastDueSubscription(payload: {
    now: number
    pastDueAt: number
    phaseId: string
    metadata?: SubscriptionPhaseMetadata
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    const { now, pastDueAt, phaseId, metadata } = payload

    // the phase that trigger the past due don't necessarily have to be the active phase
    // for instance if the subscription is past due because of a previous phase we need to mark it as past due
    // for this we need to get the machine of that phase.

    const phase = this.phases.get(phaseId)

    if (!phase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase not found",
        })
      )
    }

    if (!this.subscription || !this.customer) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription or customer not found",
        })
      )
    }

    const phaseMachine = new PhaseMachine({
      db: this.db,
      phase,
      logger: this.logger,
      subscription: this.subscription,
      customer: this.customer,
      analytics: this.analytics,
    })

    const { err: pastDueErr } = await phaseMachine.transition("PAST_DUE", {
      now,
      pastDueAt,
      metadata,
    })

    if (pastDueErr) {
      return Err(pastDueErr)
    }

    return Ok(undefined)
  }

  // change subscription implies creating a new phase and ending the current one
  // for the current phase we need to prorate open invoices, create a new invoice and collect payment
  // after that we can create the new phase
  public async changeSubscription(payload: {
    now: number
    newPhase: InsertSubscriptionPhase
    changeAt: number
    metadata?: SubscriptionPhaseMetadata
  }): Promise<
    Result<
      {
        oldPhaseStatus: PhaseStatus
        newPhaseStatus: PhaseStatus
        activePhaseId: string
        newPhaseId: string
      },
      UnPriceSubscriptionError
    >
  > {
    const { now, newPhase, changeAt, metadata } = payload

    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const activePhase = activePhaseMachine.getPhase()

    const { err: changeErr, val: change } = await activePhaseMachine.transition("CHANGE", {
      now,
      changeAt,
      metadata,
    })

    if (changeErr) {
      return Err(changeErr)
    }

    // if all goes well we create the new phase
    const { err: createPhaseErr, val: newPhaseResult } = await this.createPhase({
      input: {
        ...newPhase,
        startAt: changeAt + 1, // we need to start the new phase at the next millisecond
      },
      projectId: activePhase.projectId,
      subscriptionId: activePhase.subscriptionId,
      now,
      db: this.db,
    })

    if (createPhaseErr) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error while creating new phase: ${createPhaseErr.message}`,
        })
      )
    }

    return Ok({
      oldPhaseStatus: change.status,
      newPhaseStatus: newPhaseResult.status,
      activePhaseId: activePhase.id,
      newPhaseId: newPhaseResult.id,
    })
  }

  // end trial is a 3 step process:
  // 1. end trial
  // 2. invoice (if billed in advance)
  // 3. collect payment (if billed in advance)
  public async endSubscriptionTrial(payload: { now: number }): Promise<
    Result<
      {
        phaseStatus: PhaseStatus
        invoiceId?: string
        total?: number
        paymentInvoiceId?: string
        activePhaseId: string
      },
      UnPriceSubscriptionError
    >
  > {
    const { now } = payload
    const { err, val: activePhaseMachine } = await this.getActivePhaseMachine({
      now,
    })

    if (err) {
      return Err(err)
    }

    const activePhase = activePhaseMachine.getPhase()

    // 1. end trial
    // this will renew the subscription dates and set the trial_ended status
    const { err: endTrialErr, val: endTrialVal } = await activePhaseMachine.transition(
      "END_TRIAL",
      {
        now,
      }
    )

    // UnPriceMachineError is expected if the machine is in a state that does not allow the transition
    // which means the process failed at some point and we need to retry
    if (endTrialErr && !(endTrialErr instanceof UnPriceMachineError)) {
      return Err(endTrialErr)
    }

    const status = endTrialVal?.status ?? activePhase.status
    const whenToBill = activePhase.whenToBill

    // invoice right away if the subscription is billed in advance
    if (whenToBill === "pay_in_advance") {
      // 2. create invoice (if billed in advance)
      const { err: invoiceErr, val: invoice } = await activePhaseMachine.transition("INVOICE", {
        now,
      })

      if (invoiceErr && !(invoiceErr instanceof UnPriceMachineError)) {
        return Err(invoiceErr)
      }

      const invoiceMachine = new InvoiceStateMachine({
        db: this.db,
        phaseMachine: activePhaseMachine,
        logger: this.logger,
        analytics: this.analytics,
        invoice: invoice?.invoice!,
      })

      // 3. collect payment (if billed in advance)
      const payment = await invoiceMachine.transition("COLLECT_PAYMENT", {
        invoiceId: invoice?.invoice.id!,
        now,
        autoFinalize: true,
      })

      if (payment.err && !(payment.err instanceof UnPriceMachineError)) {
        return Err(payment.err)
      }

      const { invoiceId, retries, total, paymentInvoiceId } = payment.val!

      return Ok({
        phaseStatus: activePhase.status,
        invoiceId,
        total,
        paymentInvoiceId,
        retries,
        activePhaseId: activePhase.id,
      })
    }

    // if the subscription is not billed in advance, we just return the status of the end trial
    return Ok({
      phaseStatus: status,
      activePhaseId: activePhase.id,
    })
  }
}
