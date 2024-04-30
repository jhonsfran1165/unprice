import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"

import * as schema from "../schema"
import {
  FEATURE_TYPES,
  FEATURE_TYPES_MAPS,
  PAYMENT_PROVIDERS,
  TIER_MODES,
  USAGE_METERED,
  USAGE_MODES,
} from "../utils"

const typeFeatureSchema = z.enum(FEATURE_TYPES)
const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
const usageModeSchema = z.enum(USAGE_MODES)
const tierModeSchema = z.enum(TIER_MODES)
export type FeatureType = z.infer<typeof typeFeatureSchema>

export type PaymentProvider = z.infer<typeof paymentProviderSchema>

export const paymentInfoSchema = z.record(
  paymentProviderSchema,
  z.object({ priceId: z.string() })
)

export const configFlatFeature = z.object({
  type: z.literal(FEATURE_TYPES_MAPS.flat.code),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  config: z.object({
    price: z.coerce
      .number()
      .nonnegative()
      .min(0)
      .describe("Flat price of the feature"),
    paymentInfo: paymentInfoSchema.optional(),
  }),
})

export const configTierFeature = z.object({
  type: z.literal(FEATURE_TYPES_MAPS.tier.code),
  tierMode: tierModeSchema,
  aggregationMethod: z.enum(USAGE_METERED),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  config: z
    .object({
      tiers: z.array(
        z.object({
          unitPrice: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per Unit"),
          flatPrice: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .optional()
            .describe("Flat price for the tier"),
          firstUnit: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          lastUnit: z.union([
            z.coerce
              .number()
              .nonnegative()
              .min(0)
              .describe("Last unit for the volume"),
            z.literal("Infinity"),
          ]),
        })
      ),
      paymentInfo: paymentInfoSchema.optional(),
    })
    .superRefine((data, ctx) => {
      const tiers = data.tiers

      for (let i = 0; i < tiers.length; i++) {
        if (i > 0) {
          const currentFirstUnit = tiers[i]?.firstUnit
          const previousLastUnit = tiers[i - 1]?.lastUnit

          if (previousLastUnit === "Infinity") {
            return true
          }

          if (!currentFirstUnit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "firstUnit needs to be defined",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }

          if (!previousLastUnit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "lastUnit needs to be defined",
              path: ["tiers", i, "lastUnit"],
              fatal: true,
            })

            return false
          }

          if (currentFirstUnit > previousLastUnit + 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to be consecutive",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }
          if (currentFirstUnit < previousLastUnit + 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }
        }
      }

      return true
    }),
})

export const configUsageFeature = z.object({
  type: z.literal(FEATURE_TYPES_MAPS.usage.code),
  tierMode: tierModeSchema.optional(),
  usageMode: usageModeSchema,
  aggregationMethod: z.enum(USAGE_METERED),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  config: z
    .object({
      tiers: z.array(
        z.object({
          unitPrice: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per Unit"),
          flatPrice: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .optional()
            .describe("Flat price for the tier"),
          firstUnit: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          lastUnit: z.union([
            z.coerce
              .number()
              .nonnegative()
              .min(0)
              .describe("Last unit for the volume"),
            z.literal("Infinity"),
          ]),
        })
      ),
      paymentInfo: paymentInfoSchema.optional(),
    })
    .superRefine((data, ctx) => {
      const tiers = data.tiers

      for (let i = 0; i < tiers.length; i++) {
        if (i > 0) {
          const currentFirstUnit = tiers[i]?.firstUnit
          const previousLastUnit = tiers[i - 1]?.lastUnit

          if (previousLastUnit === "Infinity") {
            return true
          }

          if (!currentFirstUnit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "firstUnit needs to be defined",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }

          if (!previousLastUnit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "lastUnit needs to be defined",
              path: ["tiers", i, "lastUnit"],
              fatal: true,
            })

            return false
          }

          if (currentFirstUnit > previousLastUnit + 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to be consecutive",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }
          if (currentFirstUnit < previousLastUnit + 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "firstUnit"],
              fatal: true,
            })

            return false
          }
        }
      }

      return true
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
