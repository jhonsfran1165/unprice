import { type Database, type TransactionDatabase, eq } from "@unprice/db"
import { subscriptionItems, subscriptionPhases, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type InsertSubscription,
  type InsertSubscriptionPhase,
  type Subscription,
  type SubscriptionItemConfig,
  type SubscriptionItemExtended,
  type SubscriptionPhase,
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

  // private async _validatePaymentMethod(paymentMethodId: string, customerId: string, projectId: string): Promise<Result<void, UnPriceSubscriptionError>> {

  private async _getActiveItems({
    subscriptionId,
    projectId,
  }: {
    subscriptionId: string
    projectId: string
  }): Promise<Result<SubscriptionItemExtended[], UnPriceSubscriptionError>> {
    // get the subscription
    const subscription = await this.db.query.subscriptions.findFirst({
      with: {
        phases: {
          // get active phase now
          where: (phase, { eq, and, gte, lte }) =>
            and(
              eq(phase.status, "active"),
              gte(phase.startAt, Date.now()),
              lte(phase.endAt, Date.now())
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

    if (!subscription || subscription.phases.length === 0) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription not found or has no active phases",
        })
      )
    }

    const activePhase = subscription.phases[0]

    if (!activePhase || activePhase.status !== "active") {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has no active phase",
        })
      )
    }

    return Ok(activePhase.items)
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
  private async _createPhase({
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
    const endAtToUse = endAt ?? null

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
    const autoRenewToUse = autoRenew ?? versionData.autoRenew ?? true

    // get the billing cycle for the subscription given the start date
    const calculatedBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: startAtToUse,
      trialDays: trialDaysToUse,
      billingCycleStart: startCycleToUse,
      billingPeriod,
    })

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
            isUsage: item.isUsage,
          })
        )
      ).catch((e) => {
        return Err(
          new UnPriceSubscriptionError({
            message: e.message,
          })
        )
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
          })
          .where(eq(subscriptions.id, subscriptionId))
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
  private async _createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError>> {
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
          this._createPhase({
            input: phase,
            projectId,
            subscriptionId: newSubscription.id,
          })
        )
      ).catch((e) => {
        return Err(
          new UnPriceSubscriptionError({
            message: e.message,
          })
        )
      })

      return Ok(newSubscription)
    })

    if (result.err) {
      return Err(result.err)
    }

    const subscription = result.val

    return Ok(subscription)
  }

  // create the subscription and update the cache
  public async createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError>> {
    const { err, val } = await this._createSubscription({
      input,
      projectId,
    })

    if (err) {
      return Err(err)
    }

    const subscriptionData = val

    // every time a subscription is created, we update the cache
    this.waitUntil(
      this._getActiveItems({
        subscriptionId: subscriptionData.id,
        projectId,
      }).then(async (activeItemsResult) => {
        if (activeItemsResult.err) {
          console.error(activeItemsResult.err)
          return
        }

        const activeItems = activeItemsResult.val

        if (!activeItems || activeItems.length === 0) {
          // TODO: log error
          console.error("Active items not found")
          return
        }

        const customerEntitlements = activeItems.map((item) => {
          return {
            featureId: item.featurePlanVersionId,
            featureSlug: item.featurePlanVersion.feature.slug,
            featureType: item.featurePlanVersion.featureType,
            aggregationMethod: item.featurePlanVersion.aggregationMethod,
            limit: item.featurePlanVersion.limit ?? null,
            units: item.units,
          }
        })

        // get active cycle
        const startCycle = subscriptionData.currentCycleStartAt
        const endCycle = subscriptionData.currentCycleEndAt

        return Promise.all([
          // save the customer entitlements
          this.cache.entitlementsByCustomerId.set(
            subscriptionData.customerId,
            customerEntitlements
          ),
          // save features

          // we nned to think about the best way to cache the features
          activeItems.map((item) => {
            return this.cache.featureByCustomerId.set(
              `${subscriptionData.customerId}:${item.featurePlanVersion.feature.slug}:${startCycle}:${endCycle}`,
              {
                id: item.id,
                projectId: item.projectId,
                featurePlanVersionId: item.featurePlanVersionId,
                subscriptionPhaseId: item.subscriptionPhaseId,
                units: item.units,
                featureType: item.featurePlanVersion.featureType,
                aggregationMethod: item.featurePlanVersion.aggregationMethod,
                limit: item.featurePlanVersion.limit ?? null,
                currentUsage: 0,
                lastUpdatedAt: 0,
                realtime: !!item.featurePlanVersion.metadata?.realtime,
                isUsage: item.isUsage,
              }
              // {
              //   fresh: endCycle,
              //   stale: endCycle,
              // }
            )
          }),
        ])
      })
    )

    return Ok(subscriptionData)
  }
}
