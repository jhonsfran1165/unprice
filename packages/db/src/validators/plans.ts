import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import {
  configFlatFeature,
  configTieredFeature,
  configVolumeFeature,
} from "./features"

export const planVersionFeatureSchema = z
  .discriminatedUnion("type", [
    configFlatFeature,
    configTieredFeature,
    configVolumeFeature,
  ])
  .superRefine((data, ctx) => {
    if (!data) {
      return
    }

    if (!data.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid configuration for the feature",
        path: ["type"],
        fatal: true,
      })

      return false
    }

    return true
  })

export const startCycleSchema = z.union([
  z.number().nonnegative(),
  z.literal("last_day"),
  z.null(),
])

export const planSelectBaseSchema = createSelectSchema(schema.plans)
export const planInsertBaseSchema = createInsertSchema(schema.plans, {
  slug: z.string().min(1),
})

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
