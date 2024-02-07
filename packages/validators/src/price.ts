import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { schema } from "@builderai/db"

export const planBase = createSelectSchema(schema.plan, {
  id: (schema) => schema.id.cuid2(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

export const createPlanSchema = planBase
  .pick({
    slug: true,
    title: true,
    currency: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const updatePlanSchema = planBase
  .pick({
    slug: true,
    id: true,
    content: true,
    tenantId: true,
    projectId: true,
    title: true,
  })
  .partial({
    slug: true,
    projectSlug: true,
  })

export const featureBase = createSelectSchema(schema.feature, {
  title: (schema) => schema.title.min(3),
  description: (schema) => schema.description.optional(),
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
}).omit({
  createdAt: true,
  updatedAt: true,
  tenantId: true,
  projectId: true,
})

export const updateFeatureSchema = featureBase.pick({
  id: true,
  title: true,
  type: true,
  description: true,
})

export const deleteFeatureSchema = featureBase
  .pick({
    id: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const createFeatureSchema = featureBase
  .pick({
    slug: true,
    title: true,
    description: true,
    type: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const configFlatFeature = z.object({
  price: z.coerce.number().min(0),
  divider: z.coerce
    .number()
    .min(0)
    .describe("Divider for the price. Could be number of days, hours, etc."),
})

export const TIER_MODES = ["volume", "tiered"] as const

export const configMeteredFeature = z.object({
  mode: z.enum(TIER_MODES),
  divider: z.coerce
    .number()
    .min(0)
    .describe("Divider for the price. Could be number of days, hours, etc."),
  tiers: z.array(
    z.object({
      price: z.coerce.number().min(0).describe("Price per unit"),
      up: z.coerce.number().min(0),
      flat: z.coerce.number().min(0),
    })
  ),
})

export const configHybridFeature = z.object({
  price: z.coerce.number().min(0),
})

export const featurePlanSchema = featureBase
  .extend({
    groupId: z.string(),
    config: z.union([
      configFlatFeature,
      configMeteredFeature,
      configHybridFeature,
    ]),
  })
  .partial({
    config: true,
    groupId: true,
    description: true,
    projectSlug: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "flat") {
      configFlatFeature.parse(data.config)
    } else if (data.type === "metered") {
      configMeteredFeature.parse(data.config)
    } else if (data.type === "hybrid") {
      configHybridFeature.parse(data.config)
    }
  })

export const planConfigSchema = z.record(
  z.object({
    name: z.string(),
    features: z.array(featurePlanSchema),
  })
)

export const versionBase = createSelectSchema(schema.version).extend({
  featuresPlan: planConfigSchema.optional(),
  addonsPlan: planConfigSchema.optional(),
})

export const versionListBase = versionBase.pick({
  id: true,
  status: true,
  version: true,
})

export const planList = planBase.extend({
  versions: z.array(versionListBase),
})

export const createNewVersionPlan = versionBase
  .pick({
    planId: true,
  })
  .extend({
    projectSlug: z.string(),
  })

export const updateVersionPlan = versionBase
  .pick({
    planId: true,
    featuresPlan: true,
    addonsPlan: true,
    status: true,
  })
  .partial({
    status: true,
    featuresPlan: true,
    addonsPlan: true,
  })
  .extend({
    versionId: z.coerce.number().min(0),
    projectSlug: z.string(),
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
export type PlanVersion = z.infer<typeof versionBase>
export type PlanVersionList = z.infer<typeof versionListBase>
export type CreatePlanVersion = z.infer<typeof createNewVersionPlan>
export type PlanConfig = z.infer<typeof planConfigSchema>
export type FeaturePlan = z.infer<typeof featurePlanSchema>
export type CreateFeature = z.infer<typeof createFeatureSchema>
export type UpdateFeature = z.infer<typeof updateFeatureSchema>
export type Feature = z.infer<typeof featureBase>
