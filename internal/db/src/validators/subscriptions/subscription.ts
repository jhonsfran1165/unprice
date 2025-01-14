import { Err, Ok } from "@unprice/error"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { Result } from "@unprice/error"
import { subscriptionPhases, subscriptions } from "../../schema/subscriptions"
import { planVersionSelectBaseSchema } from "../planVersions"
import { UnPriceCalculationError } from "./../errors"
import type { PlanVersionExtended } from "./../planVersionFeatures"
import { configPackageSchema, planVersionExtendedSchema } from "./../planVersionFeatures"
import {
  collectionMethodSchema,
  dueBehaviourSchema,
  phaseStatusSchema,
  startCycleSchema,
  whenToBillSchema,
} from "./../shared"
import {
  type SubscriptionItem,
  type SubscriptionItemConfig,
  subscriptionItemExtendedSchema,
  subscriptionItemsConfigSchema,
  subscriptionItemsSelectSchema,
} from "./items"

const reasonSchema = z.enum([
  "payment_failed",
  "payment_pending",
  "payment_method_not_found",
  "policy_violation",
  "pending_cancellation",
  "invoice_failed",
  "invoice_pending",
  "payment_received",
  "pending_change",
  "pending_expiration",
  "trial_ended",
  "user_requested",
  "admin_requested",
  "cancelled",
  "renewed",
  "auto_renew_disabled",
])

export const invoiceMetadataSchema = z.object({
  note: z.string().optional().describe("Note about the invoice"),
  reason: reasonSchema.optional().describe("Reason for the invoice"),
})

export const subscriptionMetadataSchema = z.object({
  reason: reasonSchema.optional().describe("Reason for the subscription status"),
  note: z.string().optional().describe("Note about status in the subscription"),
  pastDue: z
    .object({
      phaseId: z.string().describe("Phase id that triggered the past due"),
      invoiceId: z.string().describe("Invoice id that triggered the past due"),
    })
    .optional()
    .describe("Past due information"),
})

export const subscriptionPhaseMetadataSchema = z.object({
  reason: reasonSchema.optional().describe("Reason for the status"),
  note: z.string().optional().describe("Note about status in the subscription phase"),
})

export const subscriptionSelectSchema = createSelectSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  timezone: z.string().min(1),
})

export const subscriptionPhaseSelectSchema = createSelectSchema(subscriptionPhases, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionPhaseMetadataSchema,
  collectionMethod: collectionMethodSchema,
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
  status: phaseStatusSchema,
  dueBehaviour: dueBehaviourSchema,
})
  .extend({
    items: subscriptionItemsSelectSchema.array().optional(),
  })
  .partial({
    createdAtM: true,
    updatedAtM: true,
  })

export const subscriptionPhaseExtendedSchema = subscriptionPhaseSelectSchema.extend({
  items: subscriptionItemExtendedSchema.array(),
  planVersion: planVersionSelectBaseSchema,
})

export const subscriptionPhaseInsertSchema = createInsertSchema(subscriptionPhases, {
  planVersionId: z.string().min(1, { message: "Plan version is required" }),
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
  metadata: subscriptionPhaseMetadataSchema,
  collectionMethod: collectionMethodSchema,
  startCycle: startCycleSchema,
  whenToBill: whenToBillSchema,
})
  .extend({
    config: subscriptionItemsConfigSchema,
    customerId: z.string(),
    paymentMethodRequired: z.boolean(),
    items: subscriptionItemsSelectSchema.array(),
  })
  .partial({
    id: true,
    customerId: true,
    paymentMethodRequired: true,
    paymentMethodId: true,
    config: true,
    items: true,
    trialDays: true,
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
    status: true,
    projectId: true,
  })
  .required({
    planVersionId: true,
  })

export const subscriptionInsertSchema = createInsertSchema(subscriptions, {
  metadata: subscriptionMetadataSchema,
  timezone: z.string().min(1),
})
  .extend({
    // when creating a subscription, we don't need the subscriptionId
    phases: subscriptionPhaseInsertSchema
      .partial({
        subscriptionId: true,
      })
      .array()
      .superRefine((data, ctx) => {
        // validate payment method if payment method is required
        data.forEach((phase, index) => {
          if (phase.paymentMethodRequired) {
            if (!phase.paymentMethodId) {
              return ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payment method is required for this phase",
                path: [index, "paymentMethodId"],
              })
            }
          }
        })

        // at least one phase is required
        if (data.length === 0) {
          return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one phase is required",
          })
        }

        // start date and end date can overlap
        for (const phase of data) {
          if (phase.endAt && phase.startAt >= phase.endAt) {
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
              message: "Phases must be consecutive, set end date of the previous phase",
              path: [i + 1, "startAt"],
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
  })
  .required({
    customerId: true,
  })

export const subscriptionExtendedSchema = subscriptionSelectSchema
  .pick({
    id: true,
    customerId: true,
    metadata: true,
  })
  .extend({
    planVersion: planVersionExtendedSchema,
    features: subscriptionItemsSelectSchema.array(),
  })

export const subscriptionChangePlanSchema = subscriptionSelectSchema
  .pick({
    id: true,
    timezone: true,
    currentCycleEndAt: true,
    projectId: true,
  })
  .extend({
    planVersionId: z.string().min(1, "Plan version is required"),
    currentPlanVersionId: z.string(),
    config: subscriptionItemsConfigSchema.optional(),
    whenToChange: z.enum(["immediately", "end_of_cycle"]).optional(),
  })

export type Subscription = z.infer<typeof subscriptionSelectSchema>
export type InsertSubscription = z.infer<typeof subscriptionInsertSchema>
export type SubscriptionExtended = z.infer<typeof subscriptionExtendedSchema>
export type InsertSubscriptionPhase = z.infer<typeof subscriptionPhaseInsertSchema>
export type SubscriptionPhase = z.infer<typeof subscriptionPhaseSelectSchema>
export type SubscriptionPhaseExtended = z.infer<typeof subscriptionPhaseExtendedSchema>
export type SubscriptionMetadata = z.infer<typeof subscriptionMetadataSchema>
export type SubscriptionPhaseMetadata = z.infer<typeof subscriptionPhaseMetadataSchema>
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
