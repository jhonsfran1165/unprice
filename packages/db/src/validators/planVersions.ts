import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import { CURRENCIES } from "../utils"
import {
  configFlatFeature,
  configTierFeature,
  configUsageFeature,
} from "./features"

// contains the configuration for the features for the specific plan version
// the reason why we save the configuration as json inside the featuresConfig is because
// it suppose to be append only, so we can keep track of the changes
export const planVersionFeatureSchema = z
  .discriminatedUnion("type", [
    configFlatFeature,
    configTierFeature,
    configUsageFeature,
  ])
  .superRefine((data, ctx) => {
    if (!data) {
      return
    }

    if (!data.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid configuration for the feature",
        path: ["pricingModel.type"],
        fatal: true,
      })

      return false
    }

    if (data.type === "tier" && !data.tierMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid configuration for the tier feature",
        path: ["pricingModel.tierMode"],
        fatal: true,
      })

      return false
    }

    if (data.type === "usage" && !data.usageMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid configuration for the usage feature",
        path: ["pricingModel.usageMode"],
        fatal: true,
      })

      return false
    }

    return true
  })

export const startCycleSchema = z.union([
  z.number().nonnegative(), // number of day from the start of the cycle
  z.literal("last_day"), // last day of the month
  z.null(), // null means the first day of the month
])

export const versionSelectBaseSchema = createSelectSchema(schema.versions, {
  featuresConfig: z.array(planVersionFeatureSchema),
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  currency: z.enum(CURRENCIES),
})

export const versionInsertBaseSchema = createInsertSchema(schema.versions, {
  featuresConfig: z.array(planVersionFeatureSchema),
  startCycle: startCycleSchema,
  tags: z.array(z.string()),
  currency: z.enum(CURRENCIES),
})
  .partial({
    projectId: true,
    id: true,
    version: true,
  })
  .required({
    planId: true,
    currency: true,
  })

export type StartCycleType = z.infer<typeof startCycleSchema>

export const versionListBase = versionSelectBaseSchema.pick({
  id: true,
  status: true,
  version: true,
})

export const planConfigSchema = z.record(
  z.object({
    name: z.string(),
    features: z.array(versionSelectBaseSchema.shape.featuresConfig),
  })
)

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

export type GroupType = "Group"

export interface Group {
  id: string
  title: string
}

export type InsertPlanVersion = z.infer<typeof versionInsertBaseSchema>
export type UpdateVersion = z.infer<typeof updateVersionPlan>
export type PlanVersion = z.infer<typeof versionSelectBaseSchema>
export type PlanVersionList = z.infer<typeof versionListBase>
export type PlanVersionFeature = z.infer<typeof planVersionFeatureSchema>
export type SelectVersion = z.infer<typeof versionSelectBaseSchema>
