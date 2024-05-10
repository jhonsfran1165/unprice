import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"
import { ZodError } from "zod"

import * as schema from "../schema"
import {
  AGGREGATION_METHODS,
  FEATURE_TYPES,
  FEATURE_TYPES_MAPS,
  PAYMENT_PROVIDERS,
  TIER_MODES,
  USAGE_MODES,
} from "../utils"
import { featureSelectBaseSchema } from "./features"

const typeFeatureSchema = z.enum(FEATURE_TYPES)
const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
const usageModeSchema = z.enum(USAGE_MODES)
const aggregationMethodSchema = z.enum(AGGREGATION_METHODS)
const tierModeSchema = z.enum(TIER_MODES)
export type FeatureType = z.infer<typeof typeFeatureSchema>

export type PaymentProvider = z.infer<typeof paymentProviderSchema>

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

export const configTierSchema = z
  .object({
    price: z.coerce.number().nonnegative().min(0).optional(),
    aggregationMethod: aggregationMethodSchema,
    tierMode: tierModeSchema,
    tiers: z.array(tiersSchema),
    usageMode: usageModeSchema.optional(),
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

export const configUsageSchema = z
  .object({
    price: z.coerce.number().nonnegative().min(0).optional(),
    usageMode: usageModeSchema,
    aggregationMethod: aggregationMethodSchema,
    tierMode: tierModeSchema,
    tiers: z.array(tiersSchema),
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

export const configFlatSchema = z.object({
  tiers: z.array(tiersSchema).optional(),
  price: z.coerce
    .number()
    .nonnegative()
    .min(0)
    .describe("Flat price of the feature"),
  usageMode: usageModeSchema.optional(),
  aggregationMethod: aggregationMethodSchema.optional(),
  tierMode: tierModeSchema.optional(),
})

export const configFeatureSchema = z.union([
  configFlatSchema,
  configTierSchema,
  configUsageSchema,
])

// TODO: use discriminated union
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
    config: configFeatureSchema.optional(),
    metadata: planVersionFeatureMetadataSchema.optional(),
  }
)
  .partial({
    projectId: true,
    id: true,
    config: true,
    metadata: true,
  })
  .required({
    planId: true,
    currency: true,
    planType: true,
    paymentProvider: true,
  })
  .superRefine((data, ctx) => {
    if (!data.config) {
      return true
    }

    // validate flat feature configuration
    if (data.featureType === FEATURE_TYPES_MAPS.flat.code) {
      try {
        configFlatSchema.parse(data.config)
      } catch (err) {
        if (err instanceof ZodError) {
          // add issues to the context
          err.errors.forEach((issue) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: [`config.${issue.path.join(".")}`],
              fatal: true,
            })
          })
        }

        return false
      }
    }

    // validate tier feature configuration
    if (data.featureType === FEATURE_TYPES_MAPS.tier.code) {
      try {
        configTierSchema.parse(data.config)
      } catch (err) {
        if (err instanceof ZodError) {
          // add issues to the context
          err.errors.forEach((issue) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: [`config.${issue.path.join(".")}`],
              fatal: true,
            })
          })
        }

        return false
      }
    }

    // validate flat feature configuration
    if (data.featureType === FEATURE_TYPES_MAPS.usage.code) {
      try {
        configUsageSchema.parse(data.config)
      } catch (err) {
        if (err instanceof ZodError) {
          // add issues to the context
          err.errors.forEach((issue) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: [`config.${issue.path.join(".")}`],
              fatal: true,
            })
          })
        }

        return false
      }
    }

    return true
  })

export type PlanVersionFeature = z.infer<
  typeof planVersionFeatureInsertBaseSchema
>

export const planVersionFeatureDragDropSchema =
  planVersionFeatureSelectBaseSchema.extend({
    feature: featureSelectBaseSchema,
  })

export type PlanVersionFeatureDragDrop = z.infer<
  typeof planVersionFeatureDragDropSchema
>
