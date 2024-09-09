import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@unprice/error"
import { Err, Ok } from "@unprice/error"

import { subscriptions } from "../../schema/subscriptions"
import { customerSelectSchema } from "../customer"
import { planVersionSelectBaseSchema } from "../planVersions"
import { UnPriceCalculationError } from "./../errors"
import type { PlanVersionExtended } from "./../planVersionFeatures"
import { configPackageSchema, planVersionExtendedSchema } from "./../planVersionFeatures"
import {
  collectionMethodSchema,
  startCycleSchema,
  subscriptionTypeSchema,
  whenToBillSchema,
} from "./../shared"
import {
  type SubscriptionItem,
  type SubscriptionItemConfig,
  subscriptionItemsConfigSchema,
  subscriptionItemsSelectSchema,
} from "./items"

export const subscriptionMetadataSchema = z.object({
  externalId: z.string().optional(),
  lastPlanChangeAt: z.number().optional(),
})

export const subscriptionSelectSchema = createSelectSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  type: subscriptionTypeSchema,
  collectionMethod: collectionMethodSchema,
  defaultPaymentMethodId: z.string().optional(),
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  timezone: z.string().min(1),
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
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    id: true,
    projectId: true,
    billingCycleStartAt: true,
    billingCycleEndAt: true,
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
