import { BaseError } from "@unprice/error"

export class UnPricePaymentProviderError extends BaseError {
  public readonly retry = false
  public readonly name = UnPricePaymentProviderError.name

  constructor({ message }: { message: string }) {
    super({
      message: `Payment provider error: ${message}`,
    })
  }
}
