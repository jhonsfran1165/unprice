import { TRPCError } from "@trpc/server"
import { subscriptionItems, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type ProjectExtended,
  type SubscriptionItemConfig,
  createDefaultSubscriptionConfig,
  type subscriptionInsertSchema,
} from "@unprice/db/validators"
import { addDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import type { z } from "zod"
import { UnpriceCustomer } from "../pkg/customer"
import { UnPriceCustomerError } from "../pkg/errors"
import type { Context } from "../trpc"

// shared logic for some procedures
// this way I use my product to build my product
// without setting up unprice sdk
export const verifyFeature = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}) => {
  const now = performance.now()
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const t = new Date()
  t.setUTCMonth(t.getUTCMonth() - 1)
  const year = t.getUTCFullYear()
  const month = t.getUTCMonth() + 1 // months are 0 indexed

  const { err, val } = await customer.verifyFeature({
    customerId,
    featureSlug,
    projectId,
    year,
    month,
    ctx,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.feature.verification",
    duration: end - now,
    customerId,
    featureSlug,
    valid: !err,
    code: err?.code ?? "",
    service: "customer",
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const getEntitlements = async ({
  customerId,
  projectId,
  ctx,
}: {
  customerId: string
  projectId: string
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  const { err, val } = await customer.getEntitlements({
    customerId,
    projectId,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying entitlements",
        })
    }
  }

  return val
}

export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  projectId,
  usage,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  usage: number
  ctx: Context
}) => {
  const customer = new UnpriceCustomer({
    cache: ctx.cache,
    db: ctx.db,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // current year and month - we only support current month and year for now
  const t = new Date()
  t.setUTCMonth(t.getUTCMonth() - 1)
  const year = t.getUTCFullYear()
  const month = t.getUTCMonth() + 1 // months are 0 indexed

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    usage,
    year,
    month,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const createSubscription = async ({
  subscription,
  ctx,
  project,
}: {
  subscription: z.infer<typeof subscriptionInsertSchema>
  project: ProjectExtended
  ctx: Context
}) => {
  const {
    planVersionId,
    customerId,
    config,
    trialDays,
    startDate,
    endDate,
    collectionMethod,
    defaultPaymentMethodId,
    metadata,
    whenToBill,
    startCycle,
    gracePeriod,
    planChangedAt,
    type,
    timezone,
  } = subscription

  const versionData = await ctx.db.query.versions.findFirst({
    with: {
      planFeatures: {
        with: {
          feature: true,
        },
      },
      plan: true,
    },
    where(fields, operators) {
      return operators.and(
        operators.eq(fields.id, planVersionId),
        operators.eq(fields.projectId, project.id)
      )
    },
  })

  if (!versionData?.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Version not found. Please check the planVersionId",
    })
  }

  // check if payment method is required for the plan version
  if (versionData?.metadata?.paymentMethodRequired && !defaultPaymentMethodId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment method is required for this plan version",
    })
  }

  if (versionData.status !== "published") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Plan version is not published, only published versions can be subscribed to",
    })
  }

  if (versionData.active !== true) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Plan version is not active, only active versions can be subscribed to",
    })
  }

  if (!versionData.planFeatures || versionData.planFeatures.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Plan version has no features",
    })
  }

  const customerData = await ctx.db.query.customers.findFirst({
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
        operators.eq(customer.projectId, project.id)
      ),
  })

  if (!customerData?.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Customer not found. Please check the customerId",
    })
  }

  // if customer is not active, throw an error
  if (!customerData.active) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Customer is not active, please contact support",
    })
  }

  // check the active subscriptions of the customer.
  // The plan version the customer is attempting to subscribe to can't have any feature that the customer already has
  const newFeatures = versionData.planFeatures.map((f) => f.feature.slug)
  const subscriptionFeatureSlugs = customerData.subscriptions.flatMap((sub) =>
    sub.items.map((f) => f.featurePlanVersion.feature.slug)
  )

  const commonFeatures = subscriptionFeatureSlugs.filter((f) => newFeatures.includes(f))

  if (commonFeatures.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `The customer is trying to subscribe to features that are already active in another subscription: ${commonFeatures.join(
        ", "
      )}`,
    })
  }

  let configItemsSubscription: SubscriptionItemConfig[] = []

  if (!config) {
    // if no items are passed, configuration is created from the default quantities of the plan version
    const { err, val } = createDefaultSubscriptionConfig({
      planVersion: versionData,
    })

    if (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message,
      })
    }

    configItemsSubscription = val
  } else {
    configItemsSubscription = config
  }

  // set the end date and start date given the timezone
  const timezoneToUse = timezone ?? customerData.timezone

  // Everything is save in UTC
  const startDateUTC = toZonedTime(startDate, "UTC")
  const endDateUTC = endDate ? toZonedTime(endDate, "UTC") : undefined
  const trialEndsAt = trialDays ? addDays(startDateUTC, trialDays) : undefined
  const planChangedAtUTC = planChangedAt ? toZonedTime(planChangedAt, "UTC") : undefined

  // execute this in a transaction
  const subscriptionData = await ctx.db.transaction(async (trx) => {
    // create the subscription
    const subscriptionId = newId("subscription")

    const newSubscription = await trx
      .insert(subscriptions)
      .values({
        id: subscriptionId,
        projectId: project.id,
        planVersionId: versionData.id,
        customerId: customerData.id,
        startDate: startDateUTC,
        endDate: endDateUTC,
        autoRenew: true,
        trialDays: trialDays,
        trialEndsAt: trialEndsAt,
        isNew: true,
        collectionMethod: collectionMethod,
        status: "active",
        metadata: metadata,
        defaultPaymentMethodId: defaultPaymentMethodId,
        whenToBill: whenToBill,
        startCycle: startCycle,
        gracePeriod: gracePeriod,
        planChangedAt: planChangedAtUTC,
        type: type,
        timezone: timezoneToUse,
      })
      .returning()
      .then((re) => re[0])

    if (!newSubscription) {
      ctx.logger.error("Error while creating subscription", {
        subscription: subscription,
      })
      trx.rollback()
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error while creating subscription",
      })
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
      ctx.logger.error("Error while creating subscription features", {
        error: e,
        configItemsSubscription,
      })

      trx.rollback()
    })

    return newSubscription
  })

  if (!subscriptionData) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error creating subscription",
    })
  }

  // every time a subscription is created, we save the subscription in the cache
  ctx.waitUntil(
    ctx.db.query.subscriptions
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
          and(eq(sub.customerId, customerData.id), eq(sub.projectId, subscriptionData.projectId)),
      })
      .then(async (subscriptions) => {
        if (!subscriptions || subscriptions.length === 0) {
          // TODO: log error
          console.error("Subscriptions not found")
          return
        }

        const customerEntitlements = subscriptions.flatMap((sub) =>
          sub.items.map((f) => f.featurePlanVersion.feature.slug)
        )

        const customerSubscriptions = subscriptions.map((sub) => sub.id)

        return Promise.all([
          // save the customer entitlements
          ctx.cache.entitlementsByCustomerId.set(customerData.id, customerEntitlements),
          // save the customer subscriptions
          ctx.cache.subscriptionsByCustomerId.set(customerData.id, customerSubscriptions),
          // save features
          subscriptions.flatMap((sub) =>
            sub.items.map((f) =>
              ctx.cache.featureByCustomerId.set(
                `${sub.customerId}:${f.featurePlanVersion.feature.slug}`,
                {
                  id: f.id,
                  projectId: f.projectId,
                  featurePlanVersionId: f.featurePlanVersion.id,
                  subscriptionId: f.subscriptionId,
                  units: f.units,
                  featureType: f.featurePlanVersion.featureType,
                  aggregationMethod: f.featurePlanVersion.aggregationMethod,
                }
              )
            )
          ),
        ])
      })
  )

  return {
    subscription: subscriptionData,
  }
}
