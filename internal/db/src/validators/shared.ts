import * as z from "zod"

import {
  AGGREGATION_METHODS,
  COLLECTION_METHODS,
  CURRENCIES,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  PAYMENT_PROVIDERS,
  SUBSCRIPTION_TYPES,
  TIER_MODES,
  USAGE_MODES,
} from "../utils"

export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
export const subscriptionTypeSchema = z.enum(SUBSCRIPTION_TYPES)
export const currencySchema = z.enum(CURRENCIES)
export const typeFeatureSchema = z.enum(FEATURE_TYPES)
export const usageModeSchema = z.enum(USAGE_MODES)
export const aggregationMethodSchema = z.enum(AGGREGATION_METHODS)
export const tierModeSchema = z.enum(TIER_MODES)
export const featureVersionType = z.enum(FEATURE_VERSION_TYPES)
export const unitSchema = z.coerce.number().int().min(1)
export const collectionMethodSchema = z.enum(COLLECTION_METHODS)
export const monthsSchema = z.coerce.number().int().min(1).max(12)
export const yearsSchema = z.coerce.number().int().min(2000).max(2100)

export type Currency = z.infer<typeof currencySchema>
export type PaymentProvider = z.infer<typeof paymentProviderSchema>
export type FeatureType = z.infer<typeof typeFeatureSchema>
export type FeatureVersionType = z.infer<typeof featureVersionType>
export type Year = z.infer<typeof yearsSchema>
export type Month = z.infer<typeof monthsSchema>
export type AggregationMethod = z.infer<typeof aggregationMethodSchema>

export const currencySymbol = (curr: Currency) =>
  ({
    USD: "$",
    EUR: "€",
    GBP: "£",
  })[curr] ?? curr
