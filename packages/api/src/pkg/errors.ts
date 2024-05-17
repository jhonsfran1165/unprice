import { z } from "zod"

export const ErrorCode = z.enum([
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_NOT_FOUND",
  "SUBSCRIPTION_NOT_ACTIVE",
  "RATE_LIMITED",
  "USAGE_EXCEEDED",
  "NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
])

export class UnPriceApiError extends Error {
  public readonly code: z.infer<typeof ErrorCode>

  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>
    message: string
  }) {
    super(message)
    this.code = code
  }
}
