import type { z } from "zod"

import type { unpricePlanErrorSchema } from "@unprice/db/validators"
import { BaseError } from "@unprice/error"

export type UnpricePlanError = z.infer<typeof unpricePlanErrorSchema>

export class UnPricePlanError extends BaseError<{ projectId?: string }> {
  public readonly retry = false
  public readonly name = UnPricePlanError.name
  public readonly code: UnpricePlanError

  constructor({
    code,
    projectId,
    message,
  }: {
    code: UnpricePlanError
    projectId?: string
    message?: string
  }) {
    super({
      message: `Plan service error: ${message}`,
      context: {
        projectId,
      },
    })
    this.code = code
  }
}
