import * as z from "zod"

import {
  AGGREGATION_METHODS,
  COLLECTION_METHODS,
  CURRENCIES,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  PAYMENT_PROVIDERS,
  PLAN_BILLING_PERIODS,
  START_CYCLES,
  SUBSCRIPTION_TYPES,
  TIER_MODES,
  USAGE_MODES,
  WHEN_TO_BILLING,
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
export const billingPeriodSchema = z.enum(PLAN_BILLING_PERIODS)
export const whenToBillSchema = z.enum(WHEN_TO_BILLING)
export const startCycleSchema = z.enum(START_CYCLES)

export const convertDateToUTC = (date: Date) => {
  // Extract date components
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()

  // Create a new UTC date with the same components, including milliseconds
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds))

  return utcDate
}

export const dateToUnixMilli = z
  .string()
  .transform((t) => new Date(t.split(" ").at(0) ?? t).getTime())

export const datetimeToUnixMilli = z.string().transform((t) => new Date(t).getTime())

// transforms the date to unix timestamp
// allow dates or numbers and transforms them to numbers
export const datetimeToUnix = z.coerce
  .date({
    message: "Date is required",
  })
  .transform((val) => {
    return val.getTime()
  })

export type Currency = z.infer<typeof currencySchema>
export type PaymentProvider = z.infer<typeof paymentProviderSchema>
export type FeatureType = z.infer<typeof typeFeatureSchema>
export type FeatureVersionType = z.infer<typeof featureVersionType>
export type Year = z.infer<typeof yearsSchema>
export type Month = z.infer<typeof monthsSchema>
export type AggregationMethod = z.infer<typeof aggregationMethodSchema>
export type StartCycleType = z.infer<typeof startCycleSchema>
export type BillingPeriod = z.infer<typeof billingPeriodSchema>
export type WhenToBill = z.infer<typeof whenToBillSchema>
