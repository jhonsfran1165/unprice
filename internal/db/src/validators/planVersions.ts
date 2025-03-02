import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"
import { versions } from "../schema/planVersions"
import {
  billingAnchorSchema,
  billingIntervalCountSchema,
  billingIntervalSchema,
  currencySchema,
  planTypeSchema,
} from "./shared"

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
})

export const billingConfigSchema = z.object({
  name: z.string().min(1),
  billingInterval: billingIntervalSchema,
  billingIntervalCount: billingIntervalCountSchema,
  billingAnchor: billingAnchorSchema,
  planType: planTypeSchema,
}).superRefine((data, ctx) => {
  if (data.planType === "recurring" && !data.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Billing interval is required for recurring plans",
      path: ["name"],
      fatal: true,
    })

    return false
  }

  // billing anchor required for recurring plans
  if (data.planType === "recurring" && !data.billingAnchor) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Billing anchor is required",
      path: ["billingAnchor"],
      fatal: true,
    })

    return false
  }

  return true
})


export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: billingConfigSchema,
  trialDays: z.coerce.number(),
})

export const versionInsertBaseSchema = createInsertSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: billingConfigSchema,
  trialDays: z.coerce.number(),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
  .partial({
    projectId: true,
    id: true,
  })
  .required({
    planId: true,
    currency: true,
    paymentProvider: true,
    paymentMethodRequired: true,
    trialDays: true,
    whenToBill: true,
    billingConfig: true,
    autoRenew: true,
  })

export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type PlanVersion = z.infer<typeof planVersionSelectBaseSchema>
export type BillingConfig = z.infer<typeof billingConfigSchema>