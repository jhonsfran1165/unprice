import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@builderai/error"
import { Err, Ok } from "@builderai/error"

import { subscriptions } from "../schema/subscriptions"
import { UnPriceCalculationError } from "./errors"
import type {
  PlanVersionExtended,
  PlanVersionFeature,
} from "./planVersionFeatures"
import {
  configFlatSchema,
  configTierSchema,
  configUsageSchema,
  planVersionExtendedSchema,
  typeFeatureSchema,
} from "./planVersionFeatures"
import type { PlanVersion } from "./planVersions"

export const subscriptionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

const itemConfigSubscriptionSchema = z.object({
  itemType: typeFeatureSchema,
  // usage based doesn't have quantity
  quantity: z.coerce.number().min(0).optional(),
  // min quantity for the item
  min: z.coerce.number().optional(),
  // limit for the item if any
  limit: z.coerce.number().optional(),
  itemId: z.string(),
  slug: z.string().optional(),
  // current usage for the item in the current billing period
  usage: z.coerce.number().optional(),
})

// stripe won't allow more than 250 items in a single invoice
export const subscriptionItemsSchema = z
  .array(itemConfigSubscriptionSchema)
  .superRefine((items, ctx) => {
    if (items.length > 250) {
      // TODO: add a better message and map to the correct path
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total items for the subscription should be less than 250",
        path: [0, "quantity"],
        fatal: true,
      })

      return false
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item?.quantity && item.limit && item.quantity > item.limit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `limit is ${item.limit}`,
          path: [i, "quantity"],
          fatal: true,
        })

        return false
      }

      if (item?.quantity && item.min && item.quantity < item.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `min is ${item.min}`,
          path: [i, "quantity"],
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
  items: subscriptionItemsSchema,
})
export const subscriptionInsertSchema = createInsertSchema(subscriptions, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  startDate: z.date({ message: "Start date is required" }),
  trialDays: z.coerce.number().int().min(0).default(0),
  metadata: subscriptionMetadataSchema,
  items: subscriptionItemsSchema,
}).partial({
  id: true,
  projectId: true,
})

export const subscriptionExtendedSchema = subscriptionSelectSchema
  .pick({
    id: true,
    planVersionId: true,
    customerId: true,
    status: true,
    items: true,
    metadata: true,
  })
  .extend({
    planVersion: planVersionExtendedSchema,
  })

interface CalculatedPrice {
  totalPriceText: string
  unitPriceText: string
  period: string
  usageMode?: z.infer<typeof configUsageSchema>["usageMode"]
  units?: number
  unitPrice?: string
  flatPrice?: string
  totalPrice: string
}

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type InsertSubscription = z.infer<typeof subscriptionInsertSchema>
export type SubscriptionItem = z.infer<typeof itemConfigSubscriptionSchema>
export type SubscriptionExtended = z.infer<typeof subscriptionExtendedSchema>

export const createDefaultSubscriptionConfig = ({
  planVersion,
}: {
  planVersion: PlanVersionExtended
}): Result<SubscriptionItem[], UnPriceCalculationError> => {
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
          itemType: planFeature.featureType,
          itemId: planFeature.id,
          slug: planFeature.feature.slug,
          quantity: 1,
          limit: 1,
          min: 1,
          max: 1,
        } as SubscriptionItem
      case "tier": {
        const config = configTierSchema.parse(planFeature.config)
        return {
          itemType: planFeature.featureType,
          itemId: planFeature.id,
          slug: planFeature.feature.slug,
          quantity:
            planFeature.defaultQuantity ?? config.tiers[0]?.firstUnit ?? 1,
          min: config.tiers[0]?.firstUnit ?? 1,
          limit: planFeature.limit,
        } as SubscriptionItem
      }
      case "usage":
        return {
          itemType: planFeature.featureType,
          itemId: planFeature.id,
          slug: planFeature.feature.slug,
          usage: 0,
          limit: planFeature.limit,
        } as SubscriptionItem
      default:
        return {
          itemType: planFeature.featureType,
          itemId: planFeature.id,
          slug: planFeature.feature.slug,
          quantity: 1,
          limit: planFeature.limit,
        } as SubscriptionItem
    }
  })

  return Ok(itemsConfig)
}

export const calculatePricePerFeature = ({
  feature,
  quantity,
  planVersion,
}: {
  feature: PlanVersionFeature
  planVersion: PlanVersion
  quantity: z.infer<typeof itemConfigSubscriptionSchema>["quantity"]
}): Result<CalculatedPrice, UnPriceCalculationError> => {
  const { billingPeriod, currency } = planVersion

  // TODO: add support for other billing periods
  const period = billingPeriod ?? "one-time"

  switch (feature.featureType) {
    // flat features have a single price independent of the quantity
    case "flat": {
      const { price } = configFlatSchema.parse(feature.config)

      return Ok({
        totalPriceText: `$${price}/${period}`,
        unitPriceText: `${currency} $${price}/${period}`,
        period,
        flatPrice: price,
        totalPrice: price,
      })
    }

    case "tier": {
      const { tiers } = configTierSchema.parse(feature.config)

      // if no quantity is provided return the first tier price
      if (!quantity) {
        const firstTier = tiers[0]

        if (!firstTier) {
          return Err(
            new UnPriceCalculationError({
              message: "There are no tiers for the feature",
            })
          )
        }

        const unitPriceText = firstTier.flatPrice
          ? `${currency} $${firstTier.flatPrice} +  per unit per $${firstTier.unitPrice}/${period}`
          : `${currency} $${firstTier.unitPrice}/${period}`

        return Ok({
          totalPriceText: `$${firstTier.unitPrice}/${period}`,
          unitPriceText: unitPriceText,
          period,
          unitPrice: firstTier.unitPrice,
          flatPrice: firstTier.flatPrice ?? undefined,
          totalPrice: firstTier.unitPrice,
        })
      }

      // find the tier that the quantity falls into
      const tier = tiers.find(
        (tier) =>
          quantity >= tier.firstUnit &&
          (tier.lastUnit === null ||
            (quantity === 0 ? quantity + 1 : quantity) <= tier.lastUnit)
      )

      if (!tier) {
        return Err(
          new UnPriceCalculationError({
            message: "Tier not found for the quantity",
          })
        )
      }

      let totalPrice = 0

      if (tier.unitPrice) {
        totalPrice = quantity * Number.parseFloat(tier.unitPrice)
      }

      if (tier.flatPrice) {
        totalPrice += Number.parseFloat(tier.flatPrice)
      }

      const unitPriceText = tier.flatPrice
        ? `${currency} $${tier.flatPrice} +  per unit per $${tier.unitPrice}/${period}`
        : `${currency} $${tier.unitPrice}/${period}`

      console.log("totalPrice", totalPrice.toFixed(2))

      return Ok({
        totalPriceText: `$${totalPrice.toFixed(2)}/${billingPeriod}`,
        unitPriceText: unitPriceText,
        period,
        unitPrice: tier.unitPrice,
        flatPrice: tier.flatPrice ?? undefined,
        totalPrice: totalPrice.toFixed(2),
      })
    }

    case "usage": {
      const { tiers, usageMode, units, price } = configUsageSchema.parse(
        feature.config
      )

      // if quantity is not provided, return default price
      if (!quantity) {
        return Ok({
          totalPriceText: `starts at $${price ?? 0}/${period}`,
          unitPriceText: `starts at ${currency} $${price ?? 0}/${period}`,
          period,
          usageMode,
          units,
          totalPrice: price ?? "0",
        })
      }

      if (usageMode === "tier" && tiers && tiers.length > 0) {
        let remaining = quantity // make a copy, so we don't mutate the original
        let total = 0

        // find the tier that the quantity falls into
        const tier = tiers.find(
          (tier) =>
            quantity >= tier.firstUnit &&
            (tier.lastUnit === null ||
              (quantity === 0 ? quantity + 1 : quantity) <= tier.lastUnit)
        )

        if (!tier) {
          return Err(
            new UnPriceCalculationError({
              message: "Tier not found for the quantity",
            })
          )
        }

        // iterate through the tiers and calculate the total price
        // for tiered usage, we need to calculate the price for each tier the quantity falls into
        // and sum them up to get the total price
        // but the flat price is only applied once where the quantity falls into the tier
        for (const tier of tiers) {
          if (remaining <= 0) {
            break
          }

          const quantityCalculation =
            tier.lastUnit === null
              ? remaining
              : Math.min(tier.lastUnit - tier.firstUnit + 1, remaining)
          remaining -= quantityCalculation

          if (tier.unitPrice) {
            total += quantityCalculation * Number.parseFloat(tier.unitPrice)
          }
        }

        tier?.flatPrice && (total += Number.parseFloat(tier.flatPrice))

        const unitPriceText = tier?.flatPrice
          ? `${currency} $${tier.flatPrice} +  per unit per $${tier.unitPrice}/${period}`
          : `${currency} $${tier.unitPrice} per unit per ${period}`

        return Ok({
          totalPriceText: `starts at $${total.toFixed(2)}/${period}`,
          unitPriceText: unitPriceText,
          period,
          usageMode,
          units,
          flatPrice: tier?.flatPrice ?? undefined,
          totalPrice: total.toFixed(2),
          unitPrice: tier?.unitPrice ?? undefined,
        })
      }

      if (usageMode === "unit" && price) {
        // unit usage is priced per unit

        return Ok({
          totalPriceText: `starts at $${(Number.parseFloat(price) * quantity).toFixed(2)}/${billingPeriod}`,
          unitPriceText: `${currency} $${price} per unit per ${period}`,
          period,
          usageMode,
          units,
          totalPrice: (Number.parseFloat(price) * quantity).toFixed(2),
          unitPrice: price,
        })
      }

      if (usageMode === "package" && units && price) {
        // round up to the next package
        const packageCount = Math.ceil(quantity / units)
        const totalPrice = (Number.parseFloat(price) * packageCount).toFixed(2)

        return Ok({
          totalPriceText: `starts at $${totalPrice}/${period}`,
          unitPriceText: `${currency} $${price} per ${units} units per ${period}`,
          period,
          usageMode,
          units,
          totalPrice: totalPrice,
        })
      }

      return Ok({
        totalPriceText: `starts at $${price ?? 0}/${period}`,
        unitPriceText: `${currency} $${price ?? 0}/${period}`,
        period,
        usageMode,
        units,
        totalPrice: price ?? "0",
      })
    }

    default:
      return Err(
        new UnPriceCalculationError({ message: "unknown feature type" })
      )
  }
}
