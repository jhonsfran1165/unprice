import { Err, Ok } from "@unprice/error"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@unprice/error"
import type { Database, TransactionDatabase } from "../.."
import { subscriptionItems, subscriptions } from "../../schema/subscriptions"
import { newId } from "../../utils/id"
import { customerSelectSchema } from "../customer"
import { planVersionSelectBaseSchema } from "../planVersions"
import { UnPriceCalculationError, UnPriceSubscriptionError } from "./../errors"
import type { PlanVersionExtended } from "./../planVersionFeatures"
import { configPackageSchema, planVersionExtendedSchema } from "./../planVersionFeatures"
import {
  collectionMethodSchema,
  startCycleSchema,
  subscriptionTypeSchema,
  whenToBillSchema,
} from "./../shared"
import { configureBillingCycleSubscription } from "./billing"
import {
  type SubscriptionItem,
  type SubscriptionItemConfig,
  subscriptionItemsConfigSchema,
  subscriptionItemsSelectSchema,
} from "./items"

const reasonSchema = z.enum([
  "user_requested",
  "admin_requested",
  "payment_failed",
  "payment_pending",
  "payment_method_not_found",
  "policy_violation",
  "no_auto_renew",
])

export const subscriptionMetadataSchema = z.object({
  reason: reasonSchema.optional().describe("Reason for the subscription status"),
  note: z.string().optional().describe("Note about status in the subscription"),
  dueBehaviour: z
    .enum(["cancel", "downgrade"])
    .optional()
    .describe("What to do when the subscription is past due"),
})

export const subscriptionSelectSchema = createSelectSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  type: subscriptionTypeSchema,
  collectionMethod: collectionMethodSchema,
  defaultPaymentMethodId: z.string().optional(),
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  timezone: z.string().min(1),
}).extend({
  nextPlanVersionId: z.string().optional(),
})

export const subscriptionInsertSchema = createInsertSchema(subscriptions, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionMetadataSchema,
  type: subscriptionTypeSchema,
  collectionMethod: collectionMethodSchema,
  defaultPaymentMethodId: z.string().optional(),
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  timezone: z.string().min(1),
})
  .extend({
    config: subscriptionItemsConfigSchema.optional(),
    nextPlanVersionId: z.string().optional(),
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
    currentCycleStartAt: true,
    currentCycleEndAt: true,
    nextInvoiceAt: true,
  })
  .required({
    customerId: true,
    planVersionId: true,
    type: true,
    startAt: true,
  })

export const subscriptionExtendedSchema = subscriptionSelectSchema
  .pick({
    id: true,
    planVersionId: true,
    customerId: true,
    status: true,
    metadata: true,
  })
  .extend({
    planVersion: planVersionExtendedSchema,
    features: subscriptionItemsSelectSchema.array(),
  })

export const subscriptionChangePlanSchema = subscriptionInsertSchema
  .partial()
  .required({
    id: true,
    customerId: true,
    projectId: true,
  })
  .superRefine((data, ctx) => {
    if (data.endAt && data.startAt && data.endAt < data.startAt) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      })
    }
  })

export const subscriptionExtendedWithItemsSchema = subscriptionSelectSchema.extend({
  customer: customerSelectSchema,
  version: planVersionSelectBaseSchema,
  items: subscriptionItemsSelectSchema.array(),
})

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type InsertSubscription = z.infer<typeof subscriptionInsertSchema>
export type SubscriptionExtended = z.infer<typeof subscriptionExtendedSchema>
export type SubscriptionChangePlan = z.infer<typeof subscriptionChangePlanSchema>

export const createDefaultSubscriptionConfig = ({
  planVersion,
  items,
}: {
  planVersion: PlanVersionExtended
  items?: SubscriptionItem[]
}): Result<SubscriptionItemConfig[], UnPriceCalculationError> => {
  if (!planVersion.planFeatures || planVersion.planFeatures.length === 0) {
    return Err(
      new UnPriceCalculationError({
        message: "Plan version does not have any features",
      })
    )
  }

  const itemsConfig = planVersion.planFeatures.map((planFeature) => {
    switch (planFeature.featureType) {
      case "flat":
        // flat features are always 1
        return {
          featurePlanId: planFeature.id,
          featureSlug: planFeature.feature.slug,
          units: 1,
          limit: 1,
          min: 1,
        }
      case "tier": {
        return {
          featurePlanId: planFeature.id,
          featureSlug: planFeature.feature.slug,
          units:
            items?.find((item) => item.featurePlanVersionId === planFeature.id)?.units ??
            planFeature.defaultQuantity ??
            1,
          min: 1,
          limit: planFeature.limit,
        }
      }
      case "usage":
        return {
          featurePlanId: planFeature.id,
          featureSlug: planFeature.feature.slug,
          limit: planFeature.limit,
        }

      case "package": {
        const config = configPackageSchema.parse(planFeature.config)
        return {
          featurePlanId: planFeature.id,
          featureSlug: planFeature.feature.slug,
          units:
            items?.find((item) => item.featurePlanVersionId === planFeature.id)?.units ??
            config.units,
          limit: planFeature.limit,
          min: 1,
        }
      }

      default:
        return {
          featurePlanId: planFeature.id,
          featureSlug: planFeature.feature.slug,
          units: planFeature.defaultQuantity,
          limit: planFeature.defaultQuantity,
          min: 1,
        }
    }
  })

  return Ok(itemsConfig as SubscriptionItemConfig[])
}

export const createSubscriptionDB = async ({
  projectId,
  subscription,
  db,
}: {
  projectId: string
  subscription: z.infer<typeof subscriptionInsertSchema>
  db: Database | TransactionDatabase
}): Promise<Result<Subscription, UnPriceSubscriptionError>> => {
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
  } = subscription

  const versionData = await db.query.versions.findFirst({
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

  const customerData = await db.query.customers.findFirst({
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
  const result = await db.transaction(async (trx) => {
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
