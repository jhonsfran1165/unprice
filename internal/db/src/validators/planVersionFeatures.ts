import * as currencies from "@dinero.js/currencies"
import type { DineroSnapshot } from "dinero.js"
import { dinero } from "dinero.js"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import * as z from "zod"
import { ZodError } from "zod"

import { planVersionFeatures } from "../schema/planVersionFeatures"
import { FEATURE_TYPES_MAPS, USAGE_MODES_MAP } from "../utils"
import { featureSelectBaseSchema } from "./features"
import { planVersionSelectBaseSchema } from "./planVersions"
import { planSelectBaseSchema } from "./plans"
import { projectSelectBaseSchema } from "./project"
import {
  aggregationMethodSchema,
  tierModeSchema,
  typeFeatureSchema,
  unitSchema,
  usageModeSchema,
} from "./shared"

export const priceSchema = z.coerce
  .string()
  .regex(/^\d{1,10}(\.\d{1,10})?$/, "Invalid price format")

export const dineroSchema = z
  .object({
    dinero: z.custom<DineroSnapshot<number>>(),
    displayAmount: priceSchema,
  })
  .transform((data, ctx) => {
    if (!data.dinero) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid dinero object",
        path: ["displayAmount"],
        fatal: true,
      })

      return z.NEVER
    }

    const priceCents = data.displayAmount

    // only rely on the currency code because the scale is not always the same
    const currencyDinero = currencies[data.dinero.currency.code as keyof typeof currencies]

    // recalculate the scale base on the currency
    const precision = priceCents.split(".")[1]?.length ?? currencyDinero.exponent

    // convert the price to the smallest unit
    const amount = Math.round(Number(priceCents) * 10 ** precision)

    const price = dinero({
      amount: amount,
      currency: currencyDinero,
      scale: precision,
    })

    try {
      return {
        dinero: price.toJSON(),
        displayAmount: priceCents,
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid dinero object",
        path: ["displayAmount"],
        fatal: true,
      })

      return z.NEVER
    }
  })

export const planVersionFeatureMetadataSchema = z.object({
  stripeProductId: z.string().optional(),
  realtime: z.boolean().optional(),
})

export const tiersSchema = z.object({
  unitPrice: dineroSchema,
  flatPrice: dineroSchema,
  firstUnit: z.coerce.number().int().min(1),
  lastUnit: z.coerce.number().int().min(1).nullable(),
})

export const configTierSchema = z
  .object({
    price: dineroSchema.optional(),
    tierMode: tierModeSchema,
    tiers: z.array(tiersSchema),
    usageMode: usageModeSchema.optional(),
    units: unitSchema.optional(),
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
    price: dineroSchema.optional(),
    usageMode: usageModeSchema,
    tierMode: tierModeSchema.optional(),
    tiers: z.array(tiersSchema).optional(),
    units: unitSchema.optional(),
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

    if (data.usageMode === USAGE_MODES_MAP.package.code) {
      if (!data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price is required when usage mode is unit",
          path: ["price"],
          fatal: true,
        })

        return false
      }

      if (!data.units) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Units for the package is required",
          path: ["unit"],
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
  price: dineroSchema,
  usageMode: usageModeSchema.optional(),
  tierMode: tierModeSchema.optional(),
  units: unitSchema.optional(),
})

export const configPackageSchema = z.object({
  tiers: z.array(tiersSchema).optional(),
  price: dineroSchema,
  usageMode: usageModeSchema.optional(),
  tierMode: tierModeSchema.optional(),
  units: unitSchema.describe("Units for the package"),
})

export const configFeatureSchema = z.union([
  configFlatSchema,
  configTierSchema,
  configUsageSchema,
  configPackageSchema,
])

// TODO: use discriminated union
export const planVersionFeatureSelectBaseSchema = createSelectSchema(planVersionFeatures, {
  config: configFeatureSchema,
  metadata: planVersionFeatureMetadataSchema,
  defaultQuantity: z.coerce.number().int().optional().default(1),
  aggregationMethod: aggregationMethodSchema,
  limit: z.coerce.number().int().optional(),
  featureType: typeFeatureSchema,
})

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
export const planVersionFeatureInsertBaseSchema = createInsertSchema(planVersionFeatures, {
  config: configFeatureSchema.optional(),
  metadata: planVersionFeatureMetadataSchema.optional(),
  aggregationMethod: aggregationMethodSchema.default("count"),
  defaultQuantity: z.coerce.number().int(),
  limit: z.coerce.number().int().optional(),
})
  .omit({
    createdAtM: true,
    updatedAtM: true,
  })
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
  })
  .transform((data) => {
    if (data.config) {
      // remove unnecessary fields
      switch (data.featureType) {
        case FEATURE_TYPES_MAPS.flat.code:
          delete data.config.tiers
          delete data.config.tierMode
          delete data.config.usageMode
          delete data.config.units

          return data

        case FEATURE_TYPES_MAPS.package.code:
          delete data.config.usageMode
          delete data.config.tiers
          delete data.config.tierMode
          delete data.config.usageMode

          return data

        case FEATURE_TYPES_MAPS.tier.code:
          delete data.config.price
          delete data.config.usageMode
          delete data.config.units

          return data

        case FEATURE_TYPES_MAPS.usage.code:
          if (data.config.usageMode === USAGE_MODES_MAP.unit.code) {
            delete data.config.tierMode
            delete data.config.tiers
          }

          if (data.config.usageMode === USAGE_MODES_MAP.tier.code) {
            delete data.config.price
            delete data.config.units
          }

          if (data.config.usageMode === USAGE_MODES_MAP.package.code) {
            delete data.config.tierMode
            delete data.config.tiers
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
          case FEATURE_TYPES_MAPS.package.code:
            configPackageSchema.parse(data.config)
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

export const planVersionFeatureDragDropSchema = planVersionFeatureSelectBaseSchema.extend({
  feature: featureSelectBaseSchema,
})

export const planVersionFeatureExtendedSchema = planVersionFeatureSelectBaseSchema.extend({
  feature: featureSelectBaseSchema,
  planVersion: planVersionSelectBaseSchema.extend({
    plan: planSelectBaseSchema,
  }),
  project: projectSelectBaseSchema,
})

export const planVersionExtendedSchema = planVersionSelectBaseSchema
  .pick({
    id: true,
    planId: true,
    status: true,
    planType: true,
    active: true,
    currency: true,
    billingPeriod: true,
    startCycle: true,
    gracePeriod: true,
    whenToBill: true,
    paymentProvider: true,
    metadata: true,
  })
  .extend({
    plan: planSelectBaseSchema.pick({
      slug: true,
    }),
    planFeatures: z.array(
      planVersionFeatureSelectBaseSchema
        .pick({
          id: true,
          featureId: true,
          featureType: true,
          planVersionId: true,
          config: true,
          metadata: true,
          limit: true,
          defaultQuantity: true,
        })
        .extend({
          feature: featureSelectBaseSchema.pick({
            id: true,
            slug: true,
          }),
        })
    ),
  })

export type PlanVersionFeature = z.infer<typeof planVersionFeatureInsertBaseSchema>

export type PlanVersionFeatureExtended = z.infer<typeof planVersionFeatureExtendedSchema>

export type PlanVersionFeatureDragDrop = z.infer<typeof planVersionFeatureDragDropSchema>

export type PlanVersionExtended = z.infer<typeof planVersionExtendedSchema>
