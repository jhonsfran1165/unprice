import { z } from "zod"

import { BaseError } from "@unprice/error"

export const apiKeyErrorSchema = z.enum([
  "NOT_FOUND",
  "REVOKED",
  "EXPIRED",
  "PROJECT_DISABLED",
  "WORKSPACE_DISABLED",
  "UNHANDLED_ERROR",
  "RATE_LIMIT_EXCEEDED",
])

export type ApiKeyError = z.infer<typeof apiKeyErrorSchema>

export class UnPriceApiKeyError extends BaseError<{ customerId: string }> {
  public readonly retry = false
  public readonly name = UnPriceApiKeyError.name
  public readonly code: ApiKeyError

  constructor({
    code,
    message,
  }: {
    code: ApiKeyError
    message?: string
  }) {
    super({
      message: `Apikey API error: ${message}`,
    })
    this.code = code
  }
}
