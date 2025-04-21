import {
  billingConfigSchema,
  customerEntitlementsSchema,
  deniedReasonSchema,
  featureSelectBaseSchema,
  planVersionFeatureSelectBaseSchema,
  subscriptionStatusSchema,
  typeFeatureSchema,
} from "@unprice/db/validators"
import { z } from "zod"

export const reportUsageSchema = z.object({
  customerId: z.string(),
  featureSlug: z.string(),
  usage: z.number(),
  idempotenceKey: z.string(),
  secondsToLive: z.number().optional(),
  timestamp: z.number(),
  projectId: z.string(),
  now: z.number().default(Date.now()),
  sync: z.boolean().optional(),
  requestId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const canSchema = z.object({
  now: z.number(),
  customerId: z.string(),
  featureSlug: z.string(),
  projectId: z.string(),
  requestId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  secondsToLive: z.number().optional(),
  performanceStart: z.number(),
})

export type ReportUsageRequest = z.infer<typeof reportUsageSchema>
export type CanRequest = z.infer<typeof canSchema>

export const canResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  deniedReason: deniedReasonSchema.optional(),
  cacheHit: z.boolean().optional(),
  remaining: z.number().optional(),
})
export type CanResponse = z.infer<typeof canResponseSchema>

export const reportUsageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  limit: z.number().optional(),
  usage: z.number().optional(),
  notifyUsage: z.boolean().optional(),
})
export type ReportUsageResponse = z.infer<typeof reportUsageResponseSchema>

export const getEntitlementsResponseSchema = z.object({
  entitlements: customerEntitlementsSchema.array(),
})

export type GetEntitlementsResponse = z.infer<typeof getEntitlementsResponseSchema>

export const getEntitlementsRequestSchema = z.object({
  customerId: z.string(),
  projectId: z.string(),
  now: z.number(),
})
export type GetEntitlementsRequest = z.infer<typeof getEntitlementsRequestSchema>

export const getUsageRequestSchema = z.object({
  customerId: z.string(),
  projectId: z.string(),
  now: z.number(),
})
export type GetUsageRequest = z.infer<typeof getUsageRequestSchema>

export const getUsageResponseSchema = z.object({
  planVersion: z.object({
    description: z.string(),
    flatPrice: z.string(),
    currentTotalPrice: z.string(),
    billingConfig: billingConfigSchema,
  }),
  subscription: z.object({
    planSlug: z.string(),
    status: subscriptionStatusSchema,
    currentCycleEndAt: z.number(),
    timezone: z.string(),
    currentCycleStartAt: z.number(),
    prorationFactor: z.number(),
    prorated: z.boolean(),
  }),
  phase: z.object({
    trialEndsAt: z.number().nullable(),
    endAt: z.number().nullable(),
    trialDays: z.number(),
    isTrial: z.boolean(),
  }),
  entitlement: z.array(
    z
      .object({
        featureSlug: z.string(),
        featureType: typeFeatureSchema,
        isCustom: z.boolean(),
        limit: z.number().nullable(),
        usage: z.number(),
        freeUnits: z.number(),
        max: z.number().nullable(),
        units: z.number().nullable(),
        included: z.number(),
        featureVersion: planVersionFeatureSelectBaseSchema.extend({
          feature: featureSelectBaseSchema,
        }),
        price: z.string().nullable(),
      })
      .optional()
  ),
})

export type GetUsageResponse = z.infer<typeof getUsageResponseSchema>
