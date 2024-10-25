import { BaseError } from "@unprice/error"

export class UnPriceCalculationError extends BaseError {
  public readonly retry = false
  public readonly name = UnPriceCalculationError.name

  constructor({ message }: { message: string }) {
    super({
      message: `Failed to calculate price: ${message}`,
    })
  }
}

export class UnPriceSubscriptionError extends BaseError<{ context?: object }> {
  public readonly retry = false
  public readonly name = UnPriceSubscriptionError.name

  constructor({ message, context }: { message: string; context?: object }) {
    super({
      message: `Subscription service error: ${message}`,
      context,
    })
  }
}
