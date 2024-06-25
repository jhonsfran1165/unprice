import * as currencies from "@dinero.js/currencies"
import type { Dinero } from "dinero.js"
import { add, dinero, isZero, multiply, toDecimal } from "dinero.js"
import { z } from "zod"

import type { Result } from "@builderai/error"
import { Err, Ok, type SchemaError } from "@builderai/error"
import { calculatePercentage } from "../../utils"
import { UnPriceCalculationError } from "./../errors"
import type { PlanVersionExtended, dineroSchema, tiersSchema } from "./../planVersionFeatures"
import {
  configFlatSchema,
  configPackageSchema,
  configTierSchema,
  configUsageSchema,
  planVersionFeatureInsertBaseSchema,
  priceSchema,
} from "./../planVersionFeatures"
import type { Currency } from "./../shared"
import { currencySymbol } from "./../shared"

const calculatePriceSchema = z.object({
  dinero: z.custom<Dinero<number>>(),
  displayAmount: priceSchema,
})

const unitsSchema = z.coerce.number().int().min(0)

interface CalculatedPrice {
  unitPrice: z.infer<typeof calculatePriceSchema>
  totalPrice: z.infer<typeof calculatePriceSchema>
}

const calculatePricePerFeatureSchema = z.object({
  quantity: unitsSchema,
  feature: planVersionFeatureInsertBaseSchema,
  /**
   * number between 0 and 1 to indicate how much to charge
   * if they have had a fixed cost item for 15/30 days, this should be 0.5
   */
  prorate: z.number().min(0).max(1).optional(),
})

export const calculateFlatPricePlan = ({
  planVersion,
}: {
  planVersion: PlanVersionExtended
}): Result<z.infer<typeof calculatePriceSchema>, UnPriceCalculationError> => {
  const defaultDineroCurrency = currencies[planVersion.currency]
  let total = dinero({ amount: 0, currency: defaultDineroCurrency })

  planVersion.planFeatures.forEach((feature) => {
    // TODO: what happen with tiers and usage?
    if (["flat", "package"].includes(feature.featureType)) {
      const { price } = configFlatSchema.parse(feature.config)
      total = add(total, dinero(price.dinero))
    }
  })

  const displayAmount = toDecimal(
    total,
    ({ value, currency }) =>
      `${currencySymbol(currency.code as Currency)}${Number.parseFloat(value)}`
  )

  return Ok({
    dinero: total,
    displayAmount: displayAmount,
  })
}

export const calculateTierPrice = ({
  tiers,
  quantity,
  tierMode,
  isUsageBased,
  prorate,
}: {
  tiers: z.infer<typeof tiersSchema>[]
  quantity: z.infer<typeof unitsSchema>
  tierMode: z.infer<typeof configTierSchema>["tierMode"]
  isUsageBased: boolean
  prorate?: number
}): Result<CalculatedPrice, UnPriceCalculationError> => {
  // return 0 price if quantity is 0
  if (quantity === 0) {
    const firstTier = tiers[0]! // we are sure that the first tier exists

    // we know the currency is the same for all tiers
    const defaultCurrency = firstTier.unitPrice.dinero.currency.code as keyof typeof currencies

    const total = dinero({
      amount: 0,
      currency: currencies[defaultCurrency],
    })

    return Ok({
      unitPrice: {
        dinero: total,
        displayAmount: toDecimal(total, ({ value, currency }) => {
          if (isUsageBased) {
            return `starts at ${currencySymbol(currency.code as Currency)}${value} per unit`
          }
          return `${currencySymbol(currency.code as Currency)}${value} per unit`
        }),
      },
      totalPrice: {
        dinero: total,
        displayAmount: toDecimal(
          total,
          ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
        ),
      },
    })
  }

  // here we have to calculate the total price based on the tier mode.
  // tier mode is volume, then all units are priced based on the final tier reached
  if (tierMode === "volume") {
    // find the tier that the quantity falls into
    const tier = tiers.find(
      (tier) => quantity >= tier.firstUnit && (tier.lastUnit === null || quantity <= tier.lastUnit)
    )! // we are sure the quantity falls into a tier

    // flat price needs to be prorated as well
    const dineroFlatPrice = prorate
      ? calculatePercentage(dinero(tier.flatPrice.dinero), prorate)
      : dinero(tier.flatPrice.dinero)
    const dineroUnitPrice = dinero(tier.unitPrice.dinero)

    const dineroTotalPrice = !isZero(dineroFlatPrice)
      ? add(multiply(dinero(tier.unitPrice.dinero), quantity), dineroFlatPrice)
      : multiply(dinero(tier.unitPrice.dinero), quantity)

    return Ok({
      unitPrice: {
        dinero: dineroUnitPrice,
        displayAmount: toDecimal(dineroUnitPrice, ({ value, currency }) => {
          const prefix = isUsageBased ? "starts at " : ""
          if (isZero(dineroFlatPrice)) {
            return `${prefix} ${currencySymbol(currency.code as Currency)}${value} per unit`
          }

          return `${prefix} ${currencySymbol(currency.code as Currency)}${toDecimal(
            dineroFlatPrice
          )} + ${currencySymbol(currency.code as Currency)}${value} per unit`
        }),
      },
      totalPrice: {
        dinero: dineroTotalPrice,
        displayAmount: toDecimal(
          dineroTotalPrice,
          ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
        ),
      },
    })
  }

  // if the tier mode is graduated, then the tiers applies progressively as quantity increases
  if (tierMode === "graduated") {
    let remaining = quantity // make a copy, so we don't mutate the original

    // find the tier that the quantity falls into
    const tier = tiers.find(
      (tier) => quantity >= tier.firstUnit && (tier.lastUnit === null || quantity <= tier.lastUnit)
    )! // we are sure the quantity falls into a tier

    // we know the currency is the same for all tiers
    const defaultCurrency = tier.unitPrice.dinero.currency.code as keyof typeof currencies
    // initialize the total price as 0
    let total: Dinero<number> = dinero({
      amount: 0,
      currency: currencies[defaultCurrency],
    })

    // iterate through the tiers and calculate the total price
    // for tiered graduated, we need to calculate the price for each tier the quantity falls into
    // and sum them up to get the total price
    // but the flat price is only applied once where the quantity falls into the tier
    for (const tier of tiers) {
      if (remaining <= 0) {
        break
      }

      const quantityCalculation =
        tier.lastUnit === null ? remaining : Math.min(tier.lastUnit - tier.firstUnit + 1, remaining)
      remaining -= quantityCalculation

      const unitPrice = dinero(tier.unitPrice.dinero)
      // multiply the unit price by the quantity calculation
      total = add(total, multiply(unitPrice, quantityCalculation))
    }

    // add the flat price of the tier the quantity falls into if it exists
    if (tier?.flatPrice) {
      // flat price needs to be prorated as well
      const dineroFlatPrice = prorate
        ? calculatePercentage(dinero(tier.flatPrice.dinero), prorate)
        : dinero(tier.flatPrice.dinero)
      total = add(total, dineroFlatPrice)
    }

    return Ok({
      unitPrice: {
        dinero: dinero(tier.unitPrice.dinero),
        displayAmount: toDecimal(dinero(tier.unitPrice.dinero), ({ value, currency }) => {
          if (isUsageBased) {
            return `starts at ${currencySymbol(currency.code as Currency)}${value} per unit`
          }

          return `${currencySymbol(currency.code as Currency)}${value} per unit`
        }),
      },
      totalPrice: {
        dinero: total,
        displayAmount: toDecimal(
          total,
          ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
        ),
      },
    })
  }

  return Err(new UnPriceCalculationError({ message: "unknown tier mode" }))
}

export const calculatePackagePrice = ({
  price,
  quantity,
  units,
  isUsageBased,
  prorate,
}: {
  price: z.infer<typeof dineroSchema>
  quantity: z.infer<typeof unitsSchema>
  units: number
  isUsageBased: boolean
  prorate?: number
}): Result<CalculatedPrice, UnPriceCalculationError> => {
  // return 0 price if quantity is 0
  if (quantity === 0) {
    const defaultCurrency = price.dinero.currency.code as keyof typeof currencies

    const total = dinero({
      amount: 0,
      currency: currencies[defaultCurrency],
    })

    return Ok({
      unitPrice: {
        dinero: total,
        displayAmount: toDecimal(total, ({ value, currency }) => {
          if (isUsageBased) {
            return `starts at ${currencySymbol(currency.code as Currency)}${value} per unit`
          }
          return `${currencySymbol(currency.code as Currency)}${value} per unit`
        }),
      },
      totalPrice: {
        dinero: total,
        displayAmount: toDecimal(
          total,
          ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
        ),
      },
    })
  }

  const packageCount = Math.ceil(quantity / units)
  const dineroPrice = dinero(price.dinero)
  const total = prorate
    ? calculatePercentage(multiply(dineroPrice, packageCount), prorate)
    : multiply(dineroPrice, packageCount)

  return Ok({
    unitPrice: {
      dinero: dineroPrice,
      displayAmount: toDecimal(dineroPrice, ({ value, currency }) => {
        if (isUsageBased) {
          return `starts at ${currencySymbol(currency.code as Currency)}${value} per unit`
        }
        return `${currencySymbol(currency.code as Currency)}${value} per ${units} unit`
      }),
    },
    totalPrice: {
      dinero: total,
      displayAmount: toDecimal(
        total,
        ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
      ),
    },
  })
}

export const calculateUnitPrice = ({
  price,
  quantity,
  isUsageBased,
  prorate,
}: {
  price: z.infer<typeof dineroSchema>
  quantity: z.infer<typeof unitsSchema>
  isUsageBased: boolean
  prorate?: number
}): Result<CalculatedPrice, UnPriceCalculationError> => {
  const dineroPrice = dinero(price.dinero)
  const total = prorate
    ? calculatePercentage(multiply(dineroPrice, quantity), prorate)
    : multiply(dineroPrice, quantity)

  return Ok({
    unitPrice: {
      dinero: dineroPrice,
      displayAmount: toDecimal(dineroPrice, ({ value, currency }) => {
        if (isUsageBased) {
          return `starts at ${currencySymbol(currency.code as Currency)}${value} per unit`
        }
        return `${currencySymbol(currency.code as Currency)}${value} per unit`
      }),
    },
    totalPrice: {
      dinero: total,
      displayAmount: toDecimal(
        total,
        ({ value, currency }) => `${currencySymbol(currency.code as Currency)}${value}`
      ),
    },
  })
}

export const calculatePricePerFeature = (
  data: z.infer<typeof calculatePricePerFeatureSchema>
): Result<CalculatedPrice, UnPriceCalculationError | SchemaError> => {
  // set default units to 0 if it's not provided
  // proration only applies to fix costs per billing period
  const { feature, quantity, prorate } = data
  const defaultQuantity = quantity ?? 0

  switch (feature.featureType) {
    case "flat": {
      const { price } = configFlatSchema.parse(feature.config)
      // flat features have a single price independent of the units
      return calculateUnitPrice({ price, quantity: 1, isUsageBased: false, prorate })
    }

    case "tier": {
      const { tiers, tierMode } = configTierSchema.parse(feature.config)
      return calculateTierPrice({
        tiers,
        quantity: defaultQuantity,
        tierMode,
        isUsageBased: false,
        prorate,
      })
    }

    case "usage": {
      const { tiers, usageMode, units, price, tierMode } = configUsageSchema.parse(feature.config)

      if (usageMode === "tier" && tierMode && tiers && tiers.length > 0) {
        return calculateTierPrice({
          tiers,
          quantity: defaultQuantity,
          tierMode,
          isUsageBased: true,
        })
      }

      if (usageMode === "unit" && price) {
        return calculateUnitPrice({ price, quantity: defaultQuantity, isUsageBased: true })
      }

      if (usageMode === "package" && units && price) {
        return calculatePackagePrice({
          price,
          quantity: defaultQuantity,
          units,
          isUsageBased: true,
        })
      }

      return Err(new UnPriceCalculationError({ message: "unknown usageMode" }))
    }

    case "package": {
      const { units, price } = configPackageSchema.parse(feature.config)

      return calculatePackagePrice({
        price,
        quantity: defaultQuantity,
        units,
        isUsageBased: false,
        prorate,
      })
    }

    default:
      return Err(new UnPriceCalculationError({ message: "unknown feature type" }))
  }
}
