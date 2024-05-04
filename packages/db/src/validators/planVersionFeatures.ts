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

export const planVersionFeatureMetadataSchema = z.object({
  externalId: z.string().optional(),
  lastTimeSyncPaymentProvider: z.number().optional(),
})

export const tiersSchema = z.object({
  unitPrice: z.coerce.number().nonnegative().min(0).describe("Price per Unit"),
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
    z.coerce.number().nonnegative().min(0).describe("Last unit for the volume"),
    z.literal("Infinity"),
  ]),
})

export const configFeatureSchema = z
  .object({
    tiers: z.array(tiersSchema),
    paymentInfo: paymentInfoSchema.optional(),
    // TODO: we have to validate this based on the type of the feature - only required for flat features
    price: z.coerce
      .number()
      .nonnegative()
      .min(0)
      .optional()
      .describe("Price for flat features"),
  })
  .superRefine((data, ctx) => {
    const tiers = data.tiers

    for (let i = 0; i < tiers.length; i++) {
      if (i > 0) {
        const currentFirstUnit = tiers[i]?.firstUnit
        const previousLastUnit = tiers[i - 1]?.lastUnit

        if (!currentFirstUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "firstUnit needs to be defined",
            path: ["tiers", i, "firstUnit"],
            fatal: true,
          })

          return false
        }

        if (previousLastUnit === Infinity || previousLastUnit === "Infinity") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Only the last unit of the tiers can be Infinity",
            path: ["tiers", i - 1, "lastUnit"],
            fatal: true,
          })

          return false
        }

        if (!previousLastUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "lastUnit needs to be defined",
            path: ["tiers", i - 1, "lastUnit"],
            fatal: true,
          })

          return false
        }

        if (currentFirstUnit > previousLastUnit + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Tiers need to be consecutive",
            path: ["tiers", i - 1, "lastUnit"],
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
  })

export const configFlatFeature = z.object({
  type: z.literal(FEATURE_TYPES_MAPS.flat.code),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  config: z.object({
    tiers: z.array(tiersSchema).optional(),
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
  config: configFeatureSchema,
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
  config: configFeatureSchema,
})

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
        path: ["type"],
        fatal: true,
      })

      return false
    }

    return true
  })

export const planVersionFeatureSelectBaseSchema = createSelectSchema(
  schema.planVersionFeatures,
  {
    config: configFeatureSchema,
    metadata: planVersionFeatureMetadataSchema,
  }
)

export const planVersionFeatureInsertBaseSchema = createInsertSchema(
  schema.planVersionFeatures,
  {
    config: configFeatureSchema,
    metadata: planVersionFeatureMetadataSchema,
  }
)
  .partial({
    projectId: true,
    id: true,
    version: true,
  })
  .required({
    planId: true,
    currency: true,
    planType: true,
    paymentProvider: true,
  })

export type PlanVersionFeature = z.infer<typeof planVersionFeatureSchema>
