import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import { versions } from "../schema/planVersions"
import { billingPeriodSchema, currencySchema, startCycleSchema } from "./shared"

export const planVersionMetadataSchema = z.object({
  externalId: z.string().optional(),
  paymentMethodRequired: z.boolean().optional(),
})

export const planVersionSelectBaseSchema = createSelectSchema(versions, {
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  metadata: planVersionMetadataSchema,
  billingPeriod: billingPeriodSchema,
  currency: currencySchema,
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
    planType: true,
    paymentProvider: true,
  })
  .superRefine((data, ctx) => {
    if (data.billingPeriod === "month") {
      if (
        data.startCycle !== "last_day_of_month" &&
        !data.startCycle?.match(/^(0?[1-9]|[12][0-9]|3[01])$/)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start cycle cannot be last day of month for monthly billing period",
          path: ["startCycle"],
          fatal: true,
        })
      }
    }

    if (data.billingPeriod === "year") {
      if (!data.startCycle?.match(/^(0?[1-9]|1[0-2])$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start cycle cannot be last day of year for yearly billing period",
          path: ["startCycle"],
          fatal: true,
        })
      }
    }

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
