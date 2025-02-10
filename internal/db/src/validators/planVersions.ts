import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { versions } from "../schema/planVersions"
import { billingPeriodSchema, currencySchema, startCycleSchema } from "./shared"

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  billingPeriod: billingPeriodSchema,
  currency: currencySchema,
})

export const versionInsertBaseSchema = createInsertSchema(versions, {
  autoRenew: z.boolean().default(true),
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  title: z.string().min(3).max(50),
  metadata: planVersionMetadataSchema,
  billingPeriod: billingPeriodSchema,
  currency: currencySchema,
  trialDays: z.coerce.number().int().min(0).max(30).default(0),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    projectId: true,
    id: true,
    startCycle: true,
  })
  .required({
    planId: true,
    currency: true,
    planType: true,
    paymentProvider: true,
    billingPeriod: true,
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

export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type PlanVersion = z.infer<typeof planVersionSelectBaseSchema>
