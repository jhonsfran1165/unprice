import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import {
  customerEntitlements,
  subscriptionItems,
  subscriptionPhases,
  subscriptions,
} from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type CustomerEntitlement,
  type InsertSubscription,
  type InsertSubscriptionPhase,
  type InvoiceStatus,
  type Subscription,
  type SubscriptionItemConfig,
  type SubscriptionItemExtended,
  type SubscriptionPhase,
  configureBillingCycleSubscription,
  createDefaultSubscriptionConfig,
  subscriptionInsertSchema,
  subscriptionPhaseInsertSchema,
  subscriptionPhaseSelectSchema,
} from "@unprice/db/validators"
import { Err, Ok, type Result, SchemaError } from "@unprice/error"
import { getDay } from "date-fns"
import type { Context } from "#trpc"
import { CustomerService } from "../customers/service"
import { UnPriceSubscriptionError } from "./errors"
import { SubscriptionMachine } from "./machine"
import type { SusbriptionMachineStatus } from "./types"
import { collectInvoicePayment, finalizeInvoice } from "./utils"
export class SubscriptionService {
  private readonly ctx: Context
  private customerService: CustomerService

  constructor(opts: Context) {
    this.ctx = opts
    this.customerService = new CustomerService(opts)
  }

  // entitlements are the actual features that are assigned to a customer
  // sync the entitlements with the subscription items, meaning end entitlements or revoke them
  // given the new phases.
  // 1. get the active items for the subscription (paid ones)
  // 2. get the current entitlements for the customer
  // 3. compare the active items with the entitlements for the current phase
  // 4. if there is a difference, create a new entitlement, deactivate the old ones or update the units
  // 5. for custom entitlements we don't do anything, they are already synced
  // TODO: FIX THIS!!
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
    const subscription = await (db ?? this.ctx.db).query.subscriptions.findFirst({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte, isNull, or }) =>
            and(
              lte(phase.startAt, now),
              or(isNull(phase.endAt), gte(phase.endAt, now)),
              eq(phase.projectId, projectId)
            ),
          // phases don't overlap, so we can use limit 1
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

    // get all the active entitlements for the customer
    const { err, val } = await this.customerService.getEntitlementsByDate({
      customerId,
      // get the entitlements for the given date
      date: now,
      // we don't want to cache the entitlements here, because we want to get the latest ones
      skipCache: true,
      // custom entitlements are not synced with the subscription items
      includeCustom: false,
      updateUsage: false,
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
      activeSubItemsMap.set(item.id, item)
    }

    for (const entitlement of activeEntitlements) {
      // there is a 1:1 relationship between the items and the entitlements
      // subItemId is null only for custom entitlements
      entitlementsMap.set(entitlement.subscriptionItemId!, entitlement)
    }
    // get the items that are not in the entitlements and create them
    // get the entitlements that are not in the items and deactivate them
    // update the lastUsageUpdateAt of the entitlements
    const entitiesToCreate: (typeof customerEntitlements.$inferInsert)[] = []
    const entitiesToUpdate: Pick<
      typeof customerEntitlements.$inferInsert,
      "id" | "lastUsageUpdateAt" | "updatedAtM" | "endAt" | "units"
    >[] = []
    const entitiesToDelete: string[] = []

    // if entitlements are not in the items, we create them
    // if entitlements are in the items, we update them with the end date of the phase

    // IMPORTANT: A customer can't have the same feature plan version assigned to multiple entitlements
    // Find items to create
    for (const item of activeSubItemsMap.values()) {
      if (!entitlementsMap.has(item.id)) {
        entitiesToCreate.push({
          id: newId("customer_entitlement"),
          projectId,
          customerId,
          subscriptionItemId: item.id,
          featurePlanVersionId: item.featurePlanVersionId,
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
      } else {
        const entitlement = entitlementsMap.get(item.id)!
        // if the entitlement is in the items, we update it with the end date of the phase
        // and the units of the item
        entitiesToUpdate.push({
          id: entitlement.id,
          endAt: activePhase?.endAt ?? null,
          units: item.units,
          lastUsageUpdateAt: now,
          updatedAtM: now,
        })
      }
    }

    // Find entitlements to delete
    for (const entitlement of entitlementsMap.values()) {
      if (!activeSubItemsMap.has(entitlement.subscriptionItemId!)) {
        entitiesToDelete.push(entitlement.id)
      }
    }

    // Perform database operations
    await (db ?? this.ctx.db).transaction(async (tx) => {
      try {
        for (const entity of entitiesToCreate) {
          await tx.insert(customerEntitlements).values(entity)
        }

        for (const entity of entitiesToUpdate) {
          await tx
            .update(customerEntitlements)
            .set(entity)
            .where(eq(customerEntitlements.id, entity.id))
        }

        for (const id of entitiesToDelete) {
          await tx
            .update(customerEntitlements)
            // if the entitlement is not in the items, end them immediately
            .set({ endAt: Date.now() })
            .where(eq(customerEntitlements.id, id))
        }
      } catch (err) {
        this.ctx.logger.error("Error syncing entitlements", {
          error: JSON.stringify(err),
        })

        tx.rollback()
        throw err
      }
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
    const { success, data, error } = subscriptionPhaseInsertSchema.safeParse(input)

    if (!success) {
      return Err(SchemaError.fromZod(error, input))
    }

    const {
      planVersionId,
      trialDays,
      metadata,
      config,
      paymentMethodId,
      startAt,
      endAt,
      subscriptionId,
    } = data

    const startAtToUse = startAt ?? now
    const endAtToUse = endAt ?? undefined

    // get subscription with phases from start date
    const subscriptionWithPhases = await (db ?? this.ctx.db).query.subscriptions.findFirst({
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

    const versionData = await (db ?? this.ctx.db).query.versions.findFirst({
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

    const result = await (db ?? this.ctx.db).transaction(async (trx) => {
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
          this.ctx.logger.error(e.message)
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
        this.ctx.logger.error(e.message)
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
        this.ctx.logger.error(syncEntitlementsResult.err.message)
        trx.rollback()
        throw syncEntitlementsResult.err
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
    const phase = await this.ctx.db.query.subscriptionPhases.findFirst({
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

    const result = await this.ctx.db.transaction(async (trx) => {
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
    const { success, data, error } = subscriptionPhaseSelectSchema.safeParse(input)

    if (!success) {
      return Err(SchemaError.fromZod(error, input))
    }

    const { startAt, endAt, items } = data

    // get subscription with phases from start date
    const subscriptionWithPhases = await (db ?? this.ctx.db).query.subscriptions.findFirst({
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

    const result = await (db ?? this.ctx.db).transaction(async (trx) => {
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
          this.ctx.logger.error("Error inserting subscription items", {
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

      // every time there is a new phase, we sync entitlements
      const syncEntitlementsResult = await this.syncEntitlementsForSubscription({
        projectId,
        customerId: subscriptionWithPhases.customerId,
        // we sync entitlements for the start date of the new phase
        // this will calculate the new entitlements for the phase
        // and add the end date to the entitlements that are no longer valid
        now: subscriptionPhase.startAt,
        db: trx,
        subscriptionId,
      })

      if (syncEntitlementsResult.err) {
        this.ctx.logger.error("Error syncing entitlements", {
          error: JSON.stringify(syncEntitlementsResult.err),
        })
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

    const customerData = await this.ctx.db.query.customers.findFirst({
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
    const result = await this.ctx.db.transaction(async (trx) => {
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
            this.ctx.logger.error(e.message)
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
          this.ctx.logger.error(`Error creating subscription phase ${phaseErr?.err?.message}`)

          trx.rollback()
          return Err(phaseErr.err)
        }

        return Ok(newSubscription)
      } catch (e) {
        this.ctx.logger.error("Error creating subscription", {
          error: JSON.stringify(e),
        })

        trx.rollback()
        throw e
      }
    })

    if (result.err) {
      return Err(result.err)
    }

    // once the subscription is created, we can update the cache
    this.ctx.waitUntil(
      this.customerService.updateCacheAllCustomerEntitlementsByDate({
        customerId,
        date: Date.now(),
      })
    )

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
      logger: this.ctx.logger,
      analytics: this.ctx.analytics,
      waitUntil: this.ctx.waitUntil,
      now,
    })

    if (err) {
      return Err(err)
    }

    const { err: errEndTrial, val: result } = await machine.endTrial()

    if (errEndTrial) {
      return Err(errEndTrial)
    }

    return Ok({
      status: result,
    })
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
      logger: this.ctx.logger,
      analytics: this.ctx.analytics,
      waitUntil: this.ctx.waitUntil,
    })

    if (err) {
      return Err(err)
    }

    // lets try to finalize the invoice
    const { err: errCollectInvoicePayment, val: resultCollectInvoicePayment } =
      await collectInvoicePayment({
        invoiceId,
        projectId,
        logger: this.ctx.logger,
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
      logger: this.ctx.logger,
      analytics: this.ctx.analytics,
      waitUntil: this.ctx.waitUntil,
    })

    if (err) {
      return Err(err)
    }

    // lets try to finalize the invoice
    const { err: errFinalizeInvoice, val: resultFinalizeInvoice } = await finalizeInvoice({
      invoiceId,
      projectId,
      logger: this.ctx.logger,
      now,
      analytics: this.ctx.analytics,
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
      logger: this.ctx.logger,
      analytics: this.ctx.analytics,
      waitUntil: this.ctx.waitUntil,
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
