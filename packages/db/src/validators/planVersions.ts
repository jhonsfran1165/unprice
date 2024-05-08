import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import { PLAN_BILLING_PERIODS } from "../utils"

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
  lastTimeSyncPaymentProvider: z.number().optional(),
  orderPlanVersionFeaturesId: z.array(z.string()).optional(), // when we preview the plan, the order of the features is important
})

export const startCycleSchema = z.union([
  z.number().nonnegative(), // number of day from the start of the cycle
  z.literal("last_day"), // last day of the month
  z.null(), // null means the first day of the month
])

export const versionSelectBaseSchema = createSelectSchema(schema.versions, {
  // featuresConfig: z.array(planVersionFeatureSchema),
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
})

export const versionInsertBaseSchema = createInsertSchema(schema.versions, {
  // featuresConfig: z.array(planVersionFeatureSchema),
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  title: z.string().min(3).max(50),
  metadata: planVersionMetadataSchema,
  billingPeriod: z.enum(PLAN_BILLING_PERIODS),
})
  .partial({
    projectId: true,
    id: true,
    version: true,
  })
  .required({
    planId: true,
    currency: true,
    planType: true,
    paymentProvider: true,
  })
  .superRefine((data, ctx) => {
    if (data.planType === "recurring" && !data.billingPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing period is required for recurring plans",
        path: ["billingPeriod"],
        fatal: true,
      })

      return false
    }

    return true
  })

export const versionListBase = versionSelectBaseSchema.pick({
  id: true,
  status: true,
  version: true,
})

export const updateVersionPlan = versionSelectBaseSchema
  .extend({
    versionId: z.coerce.number().min(0),
  })
  .pick({
    planId: true,
    featuresConfig: true,
    status: true,
    versionId: true,
  })
  .partial({
    status: true,
    featuresConfig: true,
  })

export type StartCycleType = z.infer<typeof startCycleSchema>
export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type UpdateVersion = z.infer<typeof updateVersionPlan>
export type PlanVersion = z.infer<typeof versionSelectBaseSchema>
export type PlanVersionList = z.infer<typeof versionListBase>
export type SelectVersion = z.infer<typeof versionSelectBaseSchema>
