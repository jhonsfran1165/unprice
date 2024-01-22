import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { feature, plan } from "./price.sql"

export const Plan = createSelectSchema(plan, {
  id: (schema) => schema.id.cuid2(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

export const createPlanSchema = Plan.pick({
  slug: true,
  title: true,
  currency: true,
}).extend({
  projectSlug: z.string(),
})

export type CreatePlan = z.infer<typeof createPlanSchema>

export const updatePlanSchema = Plan.pick({
  slug: true,
  id: true,
  content: true,
  tenantId: true,
  projectId: true,
  title: true,
}).partial({
  slug: true,
  projectSlug: true,
})

export type UpdatePlan = z.infer<typeof updatePlanSchema>

export const Feature = createSelectSchema(feature, {
  id: (schema) => schema.id.cuid2(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

export const updateFeatureSchema = Feature.pick({
  slug: true,
  id: true,
  projectId: true,
  title: true,
}).partial({
  slug: true,
  projectSlug: true,
})

export const createFeatureSchema = Feature.pick({
  slug: true,
  title: true,
}).extend({
  projectSlug: z.string(),
})

export type CreateFeature = z.infer<typeof createFeatureSchema>
export type UpdateFeature = z.infer<typeof updateFeatureSchema>
export type Feature = z.infer<typeof Feature>
