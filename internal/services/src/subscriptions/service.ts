import type { Database, TransactionDatabase } from "@unprice/db"
import { subscriptionItems, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import type {
  InsertSubscription,
  Subscription,
  SubscriptionItemConfig,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { getMonth, getYear } from "date-fns"
import type { Cache } from "../cache/service"
import type { Metrics } from "../metrics"
import { configureBillingCycleSubscription } from "./billing"
import { UnPriceSubscriptionError } from "./errors"
import { createDefaultSubscriptionConfig } from "./utils"

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

  public async _createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError>> {
    const {
      planVersionId,
      customerId,
      config,
      trialDays,
      startAt,
      endAt,
      collectionMethod,
      defaultPaymentMethodId,
      metadata,
      whenToBill,
      startCycle,
      gracePeriod,
      type,
      timezone,
      autoRenew,
    } = input

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

    const customerData = await this.db.query.customers.findFirst({
      with: {
        subscriptions: {
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
          // get active subscriptions of the customer
          where: (sub, { eq }) => eq(sub.status, "active"),
        },
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

    // check if payment method is required for the plan version
    const paymentMethodRequired = versionData.paymentMethodRequired
    const trialDaysToUse = trialDays ?? versionData.trialDays ?? 0

    // if the customer has a default payment method, we use that
    // TODO: here it could be a problem, if the user sends a wrong payment method id, we will use the customer default payment method
    // for now just accept the default payment method is equal to the customer default payment method
    // but probable the best approach would be use the payment method directly from the customer and don't have a default payment method in the subscription
    // or mayble we can have an array of valid payment providers in the customer, that way we can support multiple payment providers
    // the issue here would be the sync between the payment provider.
    const paymentMethodId =
      defaultPaymentMethodId ?? customerData.metadata?.stripeDefaultPaymentMethodId

    // validate payment method if there is no trails
    if (trialDaysToUse === 0) {
      if (
        defaultPaymentMethodId &&
        defaultPaymentMethodId !== customerData.metadata?.stripeDefaultPaymentMethodId
      ) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Payment method is not valid",
          })
        )
      }

      if (paymentMethodRequired && !paymentMethodId) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Payment method is required for this plan version",
          })
        )
      }
    }

    // check the active subscriptions of the customer.
    // The plan version the customer is attempting to subscribe to can't have any feature that the customer already has
    const newFeatures = versionData.planFeatures.map((f) => f.feature.slug)
    const subscriptionFeatureSlugs = customerData.subscriptions.flatMap((sub) =>
      sub.items.map((f) => f.featurePlanVersion.feature.slug)
    )

    const commonFeatures = subscriptionFeatureSlugs.filter((f) => newFeatures.includes(f))

    if (commonFeatures.length > 0) {
      return Err(
        new UnPriceSubscriptionError({
          message: `The customer is trying to subscribe to features that are already active in another subscription: ${commonFeatures.join(
            ", "
          )}`,
        })
      )
    }

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
    const timezoneToUse = timezone ?? versionData.project.timezone
    const billingPeriod = versionData.billingPeriod ?? "month"
    const whenToBillToUse = whenToBill ?? versionData.whenToBill
    const collectionMethodToUse = collectionMethod ?? versionData.collectionMethod
    const startCycleToUse = startCycle ?? versionData.startCycle ?? 1
    const autoRenewToUse = autoRenew ?? versionData.autoRenew ?? true

    let prorated = false

    // get the billing cycle for the subscription given the start date
    const calculatedBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: startAt,
      trialDays: trialDaysToUse,
      billingCycleStart: startCycleToUse,
      billingPeriod,
    })

    // calculate the next billing at given the when to bill
    const nextInvoiceAtToUse =
      whenToBillToUse === "pay_in_advance"
        ? calculatedBillingCycle.cycleStart.getTime()
        : calculatedBillingCycle.cycleEnd.getTime()
    const prorationFactor = calculatedBillingCycle.prorationFactor
    const trialDaysEndAt = calculatedBillingCycle.trialDaysEndAt
      ? calculatedBillingCycle.trialDaysEndAt.getTime()
      : undefined

    // handle proration
    // if the start date is in the middle of the billing period, we need to prorate the subscription
    if (prorationFactor < 1) {
      prorated = true
    }

    // execute this in a transaction
    const result = await this.db.transaction(async (trx) => {
      // create the subscription
      const subscriptionId = newId("subscription")

      const newSubscription = await trx
        .insert(subscriptions)
        .values({
          id: subscriptionId,
          projectId,
          planVersionId: versionData.id,
          customerId: customerData.id,
          startAt: startAt,
          endAt: endAt ?? undefined,
          autoRenew: autoRenewToUse,
          trialDays: trialDaysToUse,
          trialEndsAt: trialDaysEndAt,
          collectionMethod: collectionMethodToUse,
          status: trialDaysToUse > 0 ? "trialing" : "active",
          // if the subscription is in trial, the next billing at is the trial end at
          nextInvoiceAt: trialDaysEndAt ?? nextInvoiceAtToUse,
          active: true,
          metadata: metadata,
          defaultPaymentMethodId: defaultPaymentMethodId,
          whenToBill: whenToBillToUse,
          startCycle: startCycleToUse,
          gracePeriod: gracePeriod,
          type: type,
          timezone: timezoneToUse,
          prorated: prorated,
          currentCycleStartAt: calculatedBillingCycle.cycleStart.getTime(),
          currentCycleEndAt: calculatedBillingCycle.cycleEnd.getTime(),
        })
        .returning()
        .then((re) => re[0])

      if (!newSubscription) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Error while creating subscription",
          })
        )
      }

      // add items to the subscription
      await Promise.all(
        // this is important because every item has the configuration of the quantity of a feature in the subscription
        configItemsSubscription.map((item) =>
          trx.insert(subscriptionItems).values({
            id: newId("subscription_item"),
            projectId: newSubscription.projectId,
            subscriptionId: newSubscription.id,
            featurePlanVersionId: item.featurePlanId,
            units: item.units,
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

    return result
  }

  public async createSubscription({
    input,
    projectId,
  }: {
    input: InsertSubscription
    projectId: string
  }): Promise<Result<Subscription, UnPriceSubscriptionError>> {
    // TODO: handle input validation
    const { err, val } = await this._createSubscription({
      input,
      projectId,
    })

    if (err) {
      return Err(err)
    }

    const subscriptionData = val

    // every time a subscription is created, we update the cache the new subscriptions
    this.waitUntil(
      this.db.query.subscriptions
        .findMany({
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
          where: (sub, { eq, and }) =>
            and(
              eq(sub.customerId, subscriptionData.customerId),
              eq(sub.projectId, subscriptionData.projectId)
            ),
        })
        .then(async (subscriptions) => {
          if (!subscriptions || subscriptions.length === 0) {
            // TODO: log error
            console.error("Subscriptions not found")
            return
          }

          const customerEntitlements = subscriptions.flatMap((sub) =>
            sub.items.map((f) => {
              return {
                featureId: f.featurePlanVersion.id,
                featureSlug: f.featurePlanVersion.feature.slug,
                featureType: f.featurePlanVersion.featureType,
                aggregationMethod: f.featurePlanVersion.aggregationMethod,
                limit: f.featurePlanVersion.limit,
                units: f.units,
              }
            })
          )

          const customerSubscriptions = subscriptions.map((sub) => sub.id)
          const currentMonth = getMonth(Date.now())
          const currentYear = getYear(Date.now())

          return Promise.all([
            // save the customer entitlements
            this.cache.entitlementsByCustomerId.set(
              subscriptionData.customerId,
              customerEntitlements
            ),
            // save the customer subscriptions
            this.cache.subscriptionsByCustomerId.set(
              subscriptionData.customerId,
              customerSubscriptions
            ),
            // save features
            subscriptions.flatMap((sub) =>
              sub.items.map((f) =>
                this.cache.featureByCustomerId.set(
                  `${sub.customerId}:${f.featurePlanVersion.feature.slug}:${currentYear}:${currentMonth}`,
                  {
                    id: f.id,
                    projectId: f.projectId,
                    featurePlanVersionId: f.featurePlanVersion.id,
                    subscriptionId: f.subscriptionId,
                    units: f.units,
                    featureType: f.featurePlanVersion.featureType,
                    aggregationMethod: f.featurePlanVersion.aggregationMethod,
                    limit: f.featurePlanVersion.limit,
                    currentUsage: 0,
                    lastUpdatedAt: 0,
                    realtime: !!f.featurePlanVersion.metadata?.realtime,
                  }
                )
              )
            ),
          ])
        })
    )

    return Ok(subscriptionData)
  }
}
