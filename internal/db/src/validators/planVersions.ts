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

export const billingConfigSchema = z
  .object({
    name: z.string().min(1),
    billingInterval: billingIntervalSchema,
    billingIntervalCount: billingIntervalCountSchema,
    billingAnchor: billingAnchorSchema.optional(),
    planType: planTypeSchema,
  })
  .required({
    name: true,
    billingInterval: true,
    billingIntervalCount: true,
    planType: true,
  })
  .superRefine((data, ctx) => {
    // config is required for recurring plans
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

    // onetime plans default to day of creation
    if (data.planType === "onetime") {
      data.billingAnchor = 0
    }

    return true
  })

export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: billingConfigSchema,
  trialDays: z.coerce.number().int().min(0).default(0),
})

export const versionInsertBaseSchema = createInsertSchema(versions, {
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  currency: currencySchema,
  billingConfig: billingConfigSchema,
  trialDays: z.coerce.number().int().min(0).default(0),
})
  .required({
    planId: true,
    currency: true,
    paymentProvider: true,
    paymentMethodRequired: true,
    whenToBill: true,
    billingConfig: true,
    autoRenew: true,
  })
  .partial({
    projectId: true,
    id: true,
  })
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })

export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type PlanVersionMetadata = z.infer<typeof planVersionMetadataSchema>
export type PlanVersion = z.infer<typeof planVersionSelectBaseSchema>
export type BillingConfig = z.infer<typeof billingConfigSchema>
