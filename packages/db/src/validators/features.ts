import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import { FEATURE_TYPES, TIER_MODES } from "../utils"

const typeFeatureSchema = z.enum(FEATURE_TYPES)

export type FeatureType = z.infer<typeof typeFeatureSchema>

export const configFlatFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.flat, {
    errorMap: () => ({ message: "Invalid configuration for the feature 1" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      // TODO: add priceId from stripe
      // paymentProviderPriceId -> external price ID
      price: z.coerce
        .number()
        .nonnegative()
        .min(0)
        .describe("Flat price of the feature"),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(0)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
    })
    .optional(),
})

export const configTieredFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.tiered, {
    errorMap: () => ({ message: "Invalid configuration for the feature 2" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      mode: z.enum(TIER_MODES),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(1)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
      tiers: z.array(
        z.object({
          price: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per unit"),
          first: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          last: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Last unit for the volume"),
        })
      ),
    })
    .optional()
    .superRefine((data, ctx) => {
      // validate that the first and last are in order

      data &&
        data.tiers.forEach((tier, i) => {
          if (tier.first >= tier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to have a valid range",
              path: ["tiers", i, "last"],
              fatal: true,
            })

            return false
          }

          const prevTier = i > 0 && data.tiers[i - 1]

          if (prevTier && tier.first <= prevTier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          } else if (prevTier && prevTier.last + 1 !== tier.first) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to be consecutive",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          }

          return true
        })
    }),
})

export const configVolumeFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.volume, {
    errorMap: () => ({ message: "Invalid configuration for the feature 3" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      mode: z.enum(TIER_MODES),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(1)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
      tiers: z.array(
        z.object({
          price: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per unit"),
          first: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          last: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Last unit for the volume"),
        })
      ),
    })
    .optional()
    .superRefine((data, ctx) => {
      // validate that the first and last are in order

      data &&
        data.tiers.forEach((tier, i) => {
          if (tier.first >= tier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to have a valid range",
              path: ["tiers", i, "last"],
              fatal: true,
            })

            return false
          }

          const prevTier = i > 0 && data.tiers[i - 1]

          if (prevTier && tier.first <= prevTier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          }

          return true
        })
    }),
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

export type InsertFeature = z.infer<typeof featureInsertBaseSchema>
export type UpdateFeature = z.infer<typeof updateFeatureSchema>
export type Feature = z.infer<typeof featureSelectBaseSchema>
