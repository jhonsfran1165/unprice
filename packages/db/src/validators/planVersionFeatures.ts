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
  USAGE_MODES_MAP,
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

export const priceSchema = z.string().regex(/^\d{1,15}(\.\d{1,12})?$/)

export const tiersSchema = z.object({
  unitPrice: priceSchema,
  flatPrice: priceSchema.nullable(),
  firstUnit: z.coerce.number().int().min(1),
  lastUnit: z.coerce.number().int().min(1).nullable(),
})

export const configTierSchema = z
  .object({
    price: priceSchema.optional(),
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

        if (!previousLastUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Only the last unit of the tiers can be null",
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
    price: priceSchema.optional(),
    usageMode: usageModeSchema,
    aggregationMethod: aggregationMethodSchema,
    tierMode: tierModeSchema.optional(),
    tiers: z.array(tiersSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.usageMode === USAGE_MODES_MAP.unit.code) {
      if (!data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price is required when usage mode is unit",
          path: ["price"],
          fatal: true,
        })

        return false
      }
    }

    if (data.usageMode === USAGE_MODES_MAP.tier.code) {
      const tiers = data.tiers

      if (!tiers || tiers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tiers are required when usage mode is tier",
          path: ["usageMode"], // TODO: check path
          fatal: true,
        })

        return false
      }

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

          if (!previousLastUnit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Only the last unit of the tiers can be null",
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
    }

    return true
  })

export const configFlatSchema = z.object({
  tiers: z.array(tiersSchema).optional(),
  price: priceSchema,
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

export const parseFeaturesConfig = (feature: PlanVersionFeature) => {
  switch (feature.featureType) {
    case FEATURE_TYPES_MAPS.flat.code:
      return configFlatSchema.parse(feature.config)
    case FEATURE_TYPES_MAPS.tier.code:
      return configTierSchema.parse(feature.config)
    case FEATURE_TYPES_MAPS.usage.code:
      return configUsageSchema.parse(feature.config)
    default:
      throw new Error("Feature type not supported")
  }
}

// We avoid the use of discriminated union because of the complexity of the schema
// also zod is planning to deprecated it
// TODO: improve this when switch api is available
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
    featureId: true,
    planVersionId: true,
    featureType: true,
    paymentProvider: true,
  })
  .transform((data) => {
    if (data.config) {
      // remove unnecessary fields
      switch (data.featureType) {
        case FEATURE_TYPES_MAPS.flat.code:
          delete data.config.tiers
          delete data.config.aggregationMethod
          delete data.config.tierMode
          delete data.config.usageMode

          return {
            ...data,
            config: configFlatSchema.parse(data.config),
          }
        case FEATURE_TYPES_MAPS.tier.code:
          delete data.config.price
          delete data.config.usageMode

          return {
            ...data,
            config: configTierSchema.parse(data.config),
          }

        case FEATURE_TYPES_MAPS.usage.code:
          if (data.config.usageMode === USAGE_MODES_MAP.unit.code) {
            delete data.config.tierMode
            delete data.config.tiers
          }

          if (data.config.usageMode === USAGE_MODES_MAP.tier.code) {
            delete data.config.price
          }

          return data
        default:
          throw new Error("Feature type not supported")
      }
    }

    return data
  })
  .superRefine((data, ctx) => {
    try {
      if (data.config) {
        switch (data.featureType) {
          case FEATURE_TYPES_MAPS.flat.code:
            configFlatSchema.parse(data.config)
            break
          case FEATURE_TYPES_MAPS.tier.code:
            configTierSchema.parse(data.config)
            break
          case FEATURE_TYPES_MAPS.usage.code:
            // TODO: when usage mode is unit, price is required
            configUsageSchema.parse(data.config)
            break
          default:
            throw new Error("Feature type not supported")
        }
      }
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
