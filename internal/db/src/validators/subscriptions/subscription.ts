import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@builderai/error"
import { Err, Ok } from "@builderai/error"

import { subscriptionItems, subscriptions } from "../../schema/subscriptions"
import { UnPriceCalculationError } from "./../errors"
import type { PlanVersionExtended } from "./../planVersionFeatures"
import {
  configPackageSchema,
  planVersionExtendedSchema,
  planVersionFeatureInsertBaseSchema,
} from "./../planVersionFeatures"
import { collectionMethodSchema, subscriptionTypeSchema, typeFeatureSchema } from "./../shared"

const subscriptionItemConfigSchema = z.object({
  featurePlanId: z.string(),
  featureSlug: z.string(),
  units: z.coerce
    .number()
    .min(1)
    .optional()
    .describe("units of the feature the user is subscribed to"),
  min: z.coerce
    .number()
    .optional()
    .describe("minimum units of the feature the user is subscribed to"),
  limit: z.coerce.number().optional().describe("limit of the feature the user is subscribed to"),
})

export const subscriptionMetadataSchema = z.object({
  externalId: z.string().optional(),
  defaultPaymentMethodId: z.string().optional(),
})

export const subscriptionItemsSelectSchema = createSelectSchema(subscriptionItems, {
  // units for the item, for flat features it's always 1, usage features it's the current usage
  units: z.coerce.number().min(0),
})

export const subscriptionItemsInsertSchema = createInsertSchema(subscriptionItems, {
  // units for the item, for flat features it's always 1, usage features it's the current usage
  units: z.coerce.number().min(1),
}).partial({
  id: true,
  subscriptionId: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
})

// stripe won't allow more than 250 items in a single invoice
export const subscriptionItemsConfigSchema = z
  .array(subscriptionItemConfigSchema)
  .superRefine((items, ctx) => {
    if (items.length > 50) {
      // TODO: add a better message and map to the correct path
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total items for the subscription should be less than 50",
        path: ["."],
        fatal: true,
      })

      return false
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item?.units && item.limit && item.units > item.limit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `limit is ${item.limit}`,
          path: [i, "units"],
          fatal: true,
        })

        return false
      }

      if (item?.units && item.min && item.units < item.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `min is ${item.min}`,
          path: [i, "units"],
          fatal: true,
        })

        return false
      }
    }

    return true
  })
  .refine((items) => {
    if (items.length > 250) {
      return false
    }
    return true
  }, "Total items for the subscription should be less than 250")

export const subscriptionSelectSchema = createSelectSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  type: subscriptionTypeSchema,
  collectionMethod: collectionMethodSchema,
})

export const subscriptionInsertSchema = createInsertSchema(subscriptions, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  startDate: z.coerce.date({ message: "Start date is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionMetadataSchema,
  type: subscriptionTypeSchema,
  collectionMethod: collectionMethodSchema,
})
  .extend({
    config: subscriptionItemsConfigSchema,
  })
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    id: true,
    projectId: true,
  })
  .required({
    customerId: true,
    planVersionId: true,
    type: true,
    startDate: true,
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

export const subscriptionItemCacheSchema = subscriptionItemsSelectSchema
  .omit({
    createdAt: true,
    updatedAt: true,
    id: true,
  })
  .extend({
    featureType: typeFeatureSchema,
  })

export const subscriptionItemExtendedSchema = subscriptionItemsSelectSchema.extend({
  featurePlan: planVersionFeatureInsertBaseSchema,
})

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type InsertSubscription = z.infer<typeof subscriptionInsertSchema>
export type SubscriptionItem = z.infer<typeof subscriptionItemsSelectSchema>
export type SubscriptionItemExtended = z.infer<typeof subscriptionItemExtendedSchema>
export type InsertSubscriptionItem = z.infer<typeof subscriptionItemsInsertSchema>
export type SubscriptionExtended = z.infer<typeof subscriptionExtendedSchema>
export type SubscriptionItemConfig = z.infer<typeof subscriptionItemConfigSchema>

export const createDefaultSubscriptionConfig = ({
  planVersion,
}: {
  planVersion: PlanVersionExtended
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
          units: planFeature.defaultQuantity ?? 1,
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
          units: config.units,
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
