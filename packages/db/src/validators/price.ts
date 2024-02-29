import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const planSelectBaseSchema = createSelectSchema(schema.plans)
export const planInsertBaseSchema = createInsertSchema(schema.plans, {
  title: z.string().min(1),
  slug: z.string().min(1),
})

export const versionSelectBaseSchema = createSelectSchema(schema.versions, {
  featuresConfig: schema.versionPlanConfig,
  addonsConfig: schema.versionPlanConfig,
})
export const versionInsertBaseSchema = createInsertSchema(schema.versions, {
  featuresConfig: schema.versionPlanConfig,
  addonsConfig: schema.versionPlanConfig,
})

export const createPlanSchema = planSelectBaseSchema.pick({
  slug: true,
  title: true,
  currency: true,
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

export const featureSelectBaseSchema = createSelectSchema(schema.features)
export const featureInserBaseSchema = createInsertSchema(schema.features, {
  title: z.string().min(1).max(50),
  slug: z.string().min(1),
  type: z.string().min(1),
})

export const updateFeatureSchema = featureSelectBaseSchema.pick({
  id: true,
  title: true,
  type: true,
  description: true,
})

export const deleteFeatureSchema = featureInserBaseSchema
  .pick({
    id: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const createFeatureSchema = featureInserBaseSchema
  .pick({
    slug: true,
    title: true,
    description: true,
    type: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const versionListBase = versionSelectBaseSchema.pick({
  id: true,
  status: true,
  version: true,
})

export const planList = planSelectBaseSchema.extend({
  versions: z.array(versionListBase),
})

export const createNewVersionPlan = versionInsertBaseSchema.pick({
  planId: true,
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
    addonsConfig: true,
    status: true,
    versionId: true,
  })
  .partial({
    status: true,
    featuresConfig: true,
    addonsConfig: true,
  })

export type GroupType = "Group"
export type FeatureType = "Feature" | "Addon" | "Plan"

export interface Group {
  id: string
  title: string
}

export type PlanList = z.infer<typeof planList>
export type CreatePlan = z.infer<typeof createPlanSchema>
export type UpdatePlan = z.infer<typeof updatePlanSchema>
export type UpdateVersion = z.infer<typeof updateVersionPlan>
export type PlanVersion = z.infer<typeof versionSelectBaseSchema>
export type PlanVersionList = z.infer<typeof versionListBase>
export type CreatePlanVersion = z.infer<typeof createNewVersionPlan>
export type FeatureConfig = z.infer<typeof schema.versionPlanConfig>
export type FeaturePlan = z.infer<typeof schema.featureSchema>
export type CreateFeature = z.infer<typeof createFeatureSchema>
export type UpdateFeature = z.infer<typeof updateFeatureSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>
export type SelectVersion = z.infer<typeof versionSelectBaseSchema>
