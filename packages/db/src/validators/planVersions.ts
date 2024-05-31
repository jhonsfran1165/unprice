import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { versions } from "../schema/planVersions"
import { PLAN_BILLING_PERIODS } from "../utils"
import { currencySchema } from "./shared"

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const billingPeriodSchema = z.enum(PLAN_BILLING_PERIODS)

export const startCycleSchema = z.union([
  z.number().nonnegative(), // number of day from the start of the cycle
  z.literal("last_day"), // last day of the month
  z.null(), // null means the first day of the month
])

export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
})

export const versionInsertBaseSchema = createInsertSchema(versions, {
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  title: z.string().min(3).max(50),
  metadata: planVersionMetadataSchema,
  billingPeriod: billingPeriodSchema,
  currency: currencySchema,
})
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .partial({
    projectId: true,
    id: true,
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

export type StartCycleType = z.infer<typeof startCycleSchema>
export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type PlanVersion = z.infer<typeof planVersionSelectBaseSchema>
export type BillingPeriod = z.infer<typeof billingPeriodSchema>
