import type { z } from "zod"

import type { deniedReasonSchema, unpriceCustomerErrorSchema } from "@unprice/db/validators"
import { BaseError } from "@unprice/error"

export type DenyReason = z.infer<typeof deniedReasonSchema>
export type UnpriceCustomerError = z.infer<typeof unpriceCustomerErrorSchema>

export class UnPriceCustomerError extends BaseError<{ customerId?: string }> {
  public readonly retry = false
  public readonly name = UnPriceCustomerError.name
  public readonly code: UnpriceCustomerError

  constructor({
    code,
    customerId,
    message,
  }: {
    code: UnpriceCustomerError
    customerId?: string
    message?: string
  }) {
    super({
      message: `Customer service error: ${message}`,
      context: {
        customerId,
      },
    })
    this.code = code
  }
}
