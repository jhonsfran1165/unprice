import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
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

export const planSelectBaseSchema = createSelectSchema(schema.plans)
export const planInsertBaseSchema = createInsertSchema(schema.plans)

export const versionSelectBaseSchema = createSelectSchema(schema.versions, {
  featuresConfig: z.array(planVersionFeatureSchema),
})

export const versionInsertBaseSchema = createInsertSchema(schema.versions, {
  featuresConfig: z.array(planVersionFeatureSchema),
})

export type StartCycleType = z.infer<typeof startCycleSchema>

export const insertPlanSchema = planSelectBaseSchema.partial({
  id: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  startCycle: true,
  gracePeriod: true,
  active: true,
})

export const updatePlanSchema = planSelectBaseSchema
  .pick({
    slug: true,
    id: true,
    content: true,
    projectId: true,
    title: true,
  })
  .partial({
    slug: true,
  })

export const insertPlanVersionSchema = versionInsertBaseSchema.partial({
  id: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  startCycle: true,
  gracePeriod: true,
  active: true,
})

export const versionListBase = versionSelectBaseSchema.pick({
  id: true,
  status: true,
  version: true,
})

export const planList = planSelectBaseSchema.extend({
  versions: z.array(versionListBase),
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

export type PlanList = z.infer<typeof planList>
export type InsertPlan = z.infer<typeof insertPlanSchema>
export type UpdatePlan = z.infer<typeof updatePlanSchema>
export type InsertPlanVersion = z.infer<typeof insertPlanVersionSchema>
export type UpdateVersion = z.infer<typeof updateVersionPlan>
export type PlanVersion = z.infer<typeof versionSelectBaseSchema>
export type PlanVersionList = z.infer<typeof versionListBase>
export type PlanVersionFeature = z.infer<typeof planVersionFeatureSchema>
export type SelectVersion = z.infer<typeof versionSelectBaseSchema>
