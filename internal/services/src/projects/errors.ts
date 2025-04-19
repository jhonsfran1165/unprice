import type { z } from "zod"

import type { unpriceProjectErrorSchema } from "@unprice/db/validators"
import { BaseError } from "@unprice/error"

export type UnpriceProjectError = z.infer<typeof unpriceProjectErrorSchema>

export class UnPriceProjectError extends BaseError<{ projectId?: string }> {
  public readonly retry = false
  public readonly name = UnPriceProjectError.name
  public readonly code: UnpriceProjectError

  constructor({
    code,
    projectId,
    message,
  }: {
    code: UnpriceProjectError
    projectId?: string
    message?: string
  }) {
    super({
      message: `Project service error: ${message}`,
      context: {
        projectId,
      },
    })
    this.code = code
  }
}
