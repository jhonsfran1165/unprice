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
  type CustomerEntitlement,
  type InsertSubscription,
  type InsertSubscriptionPhase,
  type Subscription,
  type SubscriptionItemConfig,
  type SubscriptionItemExtended,
  type SubscriptionPhase,
  type SubscriptionPhaseExtended,
  createDefaultSubscriptionConfig,
  subscriptionInsertSchema,
  subscriptionPhaseInsertSchema,
} from "@unprice/db/validators"
import { Err, Ok, type Result, SchemaError } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import type { Cache } from "../cache/service"
import type { Metrics } from "../metrics"
import { configureBillingCycleSubscription } from "./billing"
import { UnPriceSubscriptionError } from "./errors"

export class SubscriptionService {
  private readonly db: Database | TransactionDatabase
  private readonly cache: Cache
  private readonly metrics: Metrics
  private readonly logger: Logger
  private readonly waitUntil: (p: Promise<unknown>) => void
  private readonly analytics: Analytics

  constructor({
    db,
    cache,
    metrics,
    logger,
    waitUntil,
    analytics,
  }: {
    db: Database | TransactionDatabase
    cache: Cache
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

  private async _getActiveEntitlements({
    customerId,
    projectId,
    now,
    includeCustom,
  }: {
    customerId: string
    projectId: string
    now: number
    includeCustom: boolean
  }): Promise<CustomerEntitlement[]> {
    // get the active entitlements for the customer
    const activeEntitlements = await this.db.query.customerEntitlements.findMany({
      where: (ent, { eq, and, gte, lte, isNull, or }) =>
        and(
          eq(ent.customerId, customerId),
          eq(ent.projectId, projectId),
          lte(ent.startAt, now),
          or(isNull(ent.endAt), gte(ent.endAt, now)),
          includeCustom ? undefined : eq(ent.isCustom, false)
        ),
    })

    return activeEntitlements
  }

  // entitlements are the actual features that are assigned to a customer
  // sync the entitlements with the subscription items
  // 1. get the active items for the subscription (paid ones)
  // 2. get the current entitlements for the customer
  // 3. compare the active items with the entitlements for the current phase
  // 4. if there is a difference, create a new entitlement
  // 5. for custom entitlements we don't do anything, they are already synced
  private async _syncEntitlements({
    subscriptionId,
    projectId,
    customerId,
    now,
  }: {
    subscriptionId: string
    projectId: string
    customerId: string
    now: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the active phase for the subscription
    const { err, val: activePhase } = await this._getActivePhase({
      subscriptionId,
      projectId,
      now,
    })

    if (err) {
      this.logger.error(err.message)
      return Err(err)
    }

    // get the active entitlements for the customer
    const activeEntitlements = await this._getActiveEntitlements({
      customerId,
      projectId,
      now,
      includeCustom: false,
    })

    const activeSubItems = activePhase.items

    const activeSubItemsMap = new Map<string, SubscriptionItemExtended>()
    const entitlementsMap = new Map<string, CustomerEntitlement>()

    for (const item of activeSubItems) {
      activeSubItemsMap.set(item.featurePlanVersionId, item)
    }

    for (const entitlement of activeEntitlements) {
      entitlementsMap.set(entitlement.featurePlanVersionId, entitlement)
    }

    // get the items that are not in the entitlements and create them
    // get the entitlements that are not in the items and deactivate them
    // update the lastUpdatedAt of the entitlements
    const entitiesToCreate: (typeof customerEntitlements.$inferInsert)[] = []
    const entitiesToDeactivate: Pick<typeof customerEntitlements.$inferInsert, "id" | "endAt">[] =
      []
    const entitiesToUpdate: Pick<
      typeof customerEntitlements.$inferInsert,
      "id" | "lastUpdatedAt"
    >[] = []

    const sqlChunks: SQL[] = []

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
          endAt: activePhase.endAt ?? null,
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
    await this.db.transaction(async (tx) => {
      try {
        if (entitiesToCreate.length > 0) {
          await tx
            .insert(customerEntitlements)
            .values(entitiesToCreate as (typeof customerEntitlements.$inferInsert)[])
        }

        if (entitiesToDeactivate.length > 0) {
          await tx
            .update(customerEntitlements)
            .set({ endAt: now })
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
            .set({ units: finalSql })
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

    // update the cache
    this.waitUntil(
      this._getActiveEntitlements({
        customerId,
        projectId,
        now,
        includeCustom: true,
      }).then(async (activeEntitlements) => {
        if (activeEntitlements.length === 0) {
          console.error("Active entitlements not found")
          return
        }

        return Promise.all([
          // save the customer entitlements
          // this.cache.entitlementsByCustomerId.set(
          //   subscriptionData.customerId,
          //   customerEntitlements
          // ),
          // save features

          // we nned to think about the best way to cache the features
          activeEntitlements.map((item) => {
            return this.cache.featureByCustomerId.set(`${customerId}:${item.featureSlug}`, item)
          }),
        ])
      })
    )

    return Ok(undefined)
  }

  private async _getActivePhase({
    subscriptionId,
    projectId,
    now,
  }: {
    subscriptionId: string
    projectId: string
    now: number
  }): Promise<Result<SubscriptionPhaseExtended, UnPriceSubscriptionError>> {
    // get the subscription
    const subscription = await this.db.query.subscriptions.findFirst({
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
            planVersion: true,
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

    if (!subscription || subscription.phases.length === 0) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found or has no active phases",
        })
      )
    }

    const activePhase = subscription.phases[0]

    if (!activePhase) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has no active phase",
        })
      )
    }

    return Ok(activePhase)
  }

  // creating a phase is a 2 step process:
  // 1. validate the input
  // 2. validate the subscription exists
  // 3. validate there is no active phase in the same start - end range for the subscription
  // 4. validate the config items are valid and there is no active subscription item in the same features
  // 5. create the phase
  // 6. create the items
  // 7. update entitlements
  // 8. update the subscription status if the phase is active
  public async createPhase({
    input,
    subscriptionId,
    projectId,
  }: {
    input: InsertSubscriptionPhase
    subscriptionId: string
    projectId: string
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

    const versionData = await this.db.query.versions.findFirst({
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

    const startAtToUse = startAt ?? Date.now()
    let endAtToUse = endAt ?? null

    // get subscription with phases from start date
    const subscription = await this.db.query.subscriptions.findFirst({
      where: (sub, { eq }) => eq(sub.id, subscriptionId),
      with: {
        phases: {
          where: (phase, { gte }) => gte(phase.startAt, startAtToUse),
        },
      },
    })

    if (!subscription) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found",
        })
      )
    }

    // verify phases don't overlap
    const overlappingPhases = subscription.phases.filter((p) => {
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

    // all this is done in a transaction

    const result = await this.db.transaction(async (trx) => {
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
            status: subscriptionPhase.status,
            active: true,
            nextInvoiceAt: nextInvoiceAtToUse,
            planSlug: versionData.plan.slug,
            currentCycleStartAt: calculatedBillingCycle.cycleStart.getTime(),
            currentCycleEndAt: calculatedBillingCycle.cycleEnd.getTime(),
            // if there is an end date, we set the expiration date
            expiresAt: endAtToUse,
          })
          .where(eq(subscriptions.id, subscriptionId))
      }

      // sync entitlements
      const syncEntitlementsResult = await this._syncEntitlements({
        subscriptionId,
        projectId,
        customerId: subscription.customerId,
        now: Date.now(),
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
  // 3. validate payment method if there is no trails
  // 5. create the subscription
  // 6. create the phases
  public async createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError | SchemaError>> {
    const { success, data, error } = subscriptionInsertSchema.safeParse(input)

    // IMPORTANT: for now we only allow one subscription per customer

    if (!success) {
      return Err(SchemaError.fromZod(error, input))
    }

    const { customerId, phases, metadata, timezone } = data

    const customerData = await this.db.query.customers.findFirst({
      with: {
        subscriptions: {
          // get active subscriptions of the customer
          where: (sub, { eq }) => eq(sub.status, "active"),
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

    // for now we only allow one subscription per customer
    if (customerData.subscriptions.length > 0) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "Customer already has a subscription, add a new phase to the existing subscription or add a new item",
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
            status: "pending",
            timezone: timezoneToUse,
            metadata: metadata,
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
        // TODO: test if a single phase fails, the subscription is not created
        await Promise.all(
          phases.map((phase) =>
            this.createPhase({
              input: phase,
              projectId,
              subscriptionId: newSubscription.id,
            })
          )
        ).catch((e) => {
          console.error(e)
          trx.rollback()
          throw e
        })

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

    const subscription = result.val

    return Ok(subscription)
  }
}
