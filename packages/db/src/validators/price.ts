import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"

export const planSelectBaseSchema = createSelectSchema(schema.plans)
export const planInsertBaseSchema = createInsertSchema(schema.plans, {
  title: z.string().min(1),
  slug: z.string().min(1),
})

export const versionSelectBaseSchema = createSelectSchema(schema.versions)
export const versionInsertBaseSchema = createInsertSchema(schema.versions, {
  featuresConfig: schema.planVersionFeatureSchema,
  addonsConfig: schema.planVersionFeatureSchema,
})

export const insertPlanSchema = planSelectBaseSchema.partial({
  id: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
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

export const featureInsertBaseSchema = createInsertSchema(schema.features, {
  title: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .refine((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: "Slug must be a valid slug",
    }),
}).partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
})

export const updateFeatureSchema = featureSelectBaseSchema.pick({
  id: true,
  title: true,
  type: true,
})

export const deleteFeatureSchema = featureInsertBaseSchema
  .pick({
    id: true,
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

export interface Group {
  id: string
  title: string
}

export type PlanList = z.infer<typeof planList>
export type InsertPlan = z.infer<typeof insertPlanSchema>
export type UpdatePlan = z.infer<typeof updatePlanSchema>
export type UpdateVersion = z.infer<typeof updateVersionPlan>
export type PlanVersion = z.infer<typeof versionSelectBaseSchema>
export type PlanVersionList = z.infer<typeof versionListBase>
export type PlanVersionFeature = z.infer<typeof schema.planVersionFeatureSchema>
export type InsertFeature = z.infer<typeof featureInsertBaseSchema>
export type UpdateFeature = z.infer<typeof updateFeatureSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>
export type SelectVersion = z.infer<typeof versionSelectBaseSchema>
