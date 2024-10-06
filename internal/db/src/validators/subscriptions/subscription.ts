import { Err, Ok } from "@unprice/error"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@unprice/error"
import { subscriptionPhases, subscriptions } from "../../schema/subscriptions"
import { customerSelectSchema } from "../customer"
import { planVersionSelectBaseSchema } from "../planVersions"
import { UnPriceCalculationError } from "./../errors"
import type { PlanVersionExtended } from "./../planVersionFeatures"
import { configPackageSchema, planVersionExtendedSchema } from "./../planVersionFeatures"
import {
  collectionMethodSchema,
  startCycleSchema,
  subscriptionStatusSchema,
  whenToBillSchema,
} from "./../shared"
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

export const subscriptionPhaseMetadataSchema = z.object({
  reason: reasonSchema.optional().describe("Reason for the status"),
})

export const subscriptionSelectSchema = createSelectSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  timezone: z.string().min(1),
  status: subscriptionStatusSchema.optional(),
})

export const subscriptionPhaseSelectSchema = createSelectSchema(subscriptionPhases, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionPhaseMetadataSchema,
  collectionMethod: collectionMethodSchema,
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  status: subscriptionStatusSchema,
})

export const subscriptionPhaseInsertSchema = createInsertSchema(subscriptionPhases, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionPhaseMetadataSchema,
  collectionMethod: collectionMethodSchema,
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  status: subscriptionStatusSchema,
})
  .extend({
    config: subscriptionItemsConfigSchema.optional(),
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    status: true,
    id: true,
    projectId: true,
    subscriptionId: true,
  })
  .required({
    planVersionId: true,
  })

export const subscriptionInsertSchema = createInsertSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  timezone: z.string().min(1),
  status: subscriptionStatusSchema,
})
  .extend({
    phases: subscriptionPhaseInsertSchema.array().superRefine((data, ctx) => {
      // at least one phase is required
      if (data.length === 0) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one phase is required",
        })
      }

      // start date and end date can overlap
      for (const phase of data) {
        if (phase.startAt && phase.endAt && phase.startAt >= phase.endAt) {
          return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Start date must be before end date",
          })
        }
      }

      // phases must be consecutive and in order
      for (let i = 0; i < data.length - 1; i++) {
        const currentPhase = data[i]
        const nextPhase = data[i + 1]

        if (currentPhase?.endAt && nextPhase?.startAt && currentPhase.endAt > nextPhase.startAt) {
          return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Phases must be consecutive",
          })
        }
      }
    }),
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
    status: true,
  })
  .required({
    customerId: true,
  })

export const subscriptionExtendedSchema = subscriptionSelectSchema
  .pick({
    id: true,
    customerId: true,
    status: true,
    metadata: true,
  })
  .extend({
    planVersion: planVersionExtendedSchema,
    features: subscriptionItemsSelectSchema.array(),
  })

export const subscriptionChangePlanSchema = subscriptionInsertSchema.partial().required({
  id: true,
  customerId: true,
  projectId: true,
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
export type InsertSubscriptionPhase = z.infer<typeof subscriptionPhaseInsertSchema>
export type SubscriptionPhase = z.infer<typeof subscriptionPhaseSelectSchema>

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
          isUsage: true,
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
