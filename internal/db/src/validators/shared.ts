import * as z from "zod"

import { extendZodWithOpenApi } from "zod-openapi"
import {
  AGGREGATION_METHODS,
  BILLING_INTERVALS,
  COLLECTION_METHODS,
  CURRENCIES,
  DUE_BEHAVIOUR,
  FEATURE_TYPES,
  FEATURE_VERSION_TYPES,
  INVOICE_STATUS,
  INVOICE_TYPE,
  PAYMENT_PROVIDERS,
  PLAN_TYPES,
  SUBSCRIPTION_STATUS,
  TIER_MODES,
  USAGE_MODES,
  WHEN_TO_BILLING,
} from "../utils"

extendZodWithOpenApi(z)

export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS)
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
export const whenToBillSchema = z.enum(WHEN_TO_BILLING)
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUS)
export const dueBehaviourSchema = z.enum(DUE_BEHAVIOUR)
export const invoiceStatusSchema = z.enum(INVOICE_STATUS)
export const invoiceTypeSchema = z.enum(INVOICE_TYPE)
export const billingAnchorSchema = z
  .union([
    z.number().int().min(1).max(31).openapi({
      description:
        "Days of the month. Pick a number between 1 and 31, if the month has less days, it will be the last day of the month",
    }),
    z.literal("dayOfCreation").openapi({
      description: "the day of the creation of the subscription as the billing anchor",
    }),
  ])
  .default("dayOfCreation")

export const billingIntervalSchema = z.enum(BILLING_INTERVALS)
export const billingIntervalCountSchema = z.coerce.number().int().min(1).max(12)
export const planTypeSchema = z.enum(PLAN_TYPES)

export const unpriceCustomerErrorSchema = z.enum([
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_NOT_ACTIVE",
  "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
  "CUSTOMER_SUBSCRIPTION_NOT_FOUND",
  "CUSTOMER_NOT_FOUND",
  "CUSTOMER_ENTITLEMENTS_NOT_FOUND",
  "FEATURE_TYPE_NOT_SUPPORTED",
  "PROJECT_DISABLED",
  "CUSTOMER_DISABLED",
  "PLAN_VERSION_NOT_PUBLISHED",
  "PLAN_VERSION_NOT_ACTIVE",
  "PAYMENT_PROVIDER_CONFIG_NOT_FOUND",
  "ENTITLEMENT_EXPIRED",
  "ENTITLEMENT_NOT_ACTIVE",
  "CUSTOMER_SESSION_NOT_CREATED",
  "CUSTOMER_SESSION_NOT_FOUND",
  "PLAN_VERSION_NOT_FOUND",
  "PAYMENT_PROVIDER_ERROR",
  "SUBSCRIPTION_NOT_CREATED",
  "CUSTOMER_NOT_CREATED",
  "SUBSCRIPTION_NOT_CANCELED",
  "CUSTOMER_PHASE_NOT_FOUND",
  "CURRENCY_MISMATCH",
])

export const unpriceProjectErrorSchema = z.enum([
  "PROJECT_FEATURES_NOT_FOUND",
  "PROJECT_NOT_FOUND",
  "PROJECT_NOT_ENABLED",
])

export const deniedReasonSchema = z.enum([
  "RATE_LIMITED",
  "CUSTOMER_SUBSCRIPTION_NOT_FOUND",
  "ENTITLEMENT_NOT_FOUND",
  "LIMIT_EXCEEDED",
  "ENTITLEMENT_EXPIRED",
  "ENTITLEMENT_NOT_ACTIVE",
])

export const convertDateToUTC = (date: Date) => {
  // Check if the date is already in UTC
  if (
    date.getUTCFullYear() === date.getFullYear() &&
    date.getUTCMonth() === date.getMonth() &&
    date.getUTCDate() === date.getDate() &&
    date.getUTCHours() === date.getHours() &&
    date.getUTCMinutes() === date.getMinutes() &&
    date.getUTCSeconds() === date.getSeconds()
  ) {
    // The date is already in UTC, return it as is
    return date
  }

  // Create a new Date object with UTC values
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  )
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
export type WhenToBill = z.infer<typeof whenToBillSchema>
export type BillingAnchor = z.infer<typeof billingAnchorSchema>
export type CollectionMethod = z.infer<typeof collectionMethodSchema>
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>
export type InvoiceType = z.infer<typeof invoiceTypeSchema>
export type BillingInterval = z.infer<typeof billingIntervalSchema>
export type PlanType = z.infer<typeof planTypeSchema>
