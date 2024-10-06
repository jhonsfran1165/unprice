import { z } from "zod"

import { BaseError } from "@unprice/error"

export const unpriceCustomerErrorSchema = z.enum([
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_NOT_ACTIVE",
  "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
  "FEATURE_OR_CUSTOMER_NOT_FOUND",
  "CUSTOMER_HAS_NO_SUBSCRIPTIONS",
  "CUSTOMER_NOT_FOUND",
  "FEATURE_TYPE_NOT_SUPPORTED",
  "FEATURE_IS_NOT_USAGE_TYPE",
  "FEATURE_HAS_NO_USAGE_RECORD",
  "FEATURE_NOT_SUPPORT_USAGE",
  "UNHANDLED_ERROR",
])

export const deniedReasonSchema = z.enum([
  "RATE_LIMITED",
  "USAGE_EXCEEDED",
  "FEATURE_NOT_FOUND_IN_SUBSCRIPTION",
  "FEATURE_OR_CUSTOMER_NOT_FOUND",
  "FEATURE_HAS_NO_USAGE_RECORD",
  "LIMIT_EXCEEDED",
])

export type DenyReason = z.infer<typeof deniedReasonSchema>
export type UnpriceCustomerError = z.infer<typeof unpriceCustomerErrorSchema>

export class UnPriceCustomerError extends BaseError<{ customerId: string }> {
  public readonly retry = false
  public readonly name = UnPriceCustomerError.name
  public readonly code: UnpriceCustomerError

  constructor({
    code,
    customerId,
  }: {
    code: UnpriceCustomerError
    customerId: string
  }) {
    super({
      message: "Customer API error",
      context: {
        customerId,
      },
    })
    this.code = code
  }
}
