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

export class UnPriceSubscriptionError extends BaseError<{ context?: Record<string, unknown> }> {
  public readonly retry = false
  public readonly name = UnPriceSubscriptionError.name

  constructor({ message, context }: { message: string; context?: Record<string, unknown> }) {
    super({
      message: `${message}`,
      context,
    })
  }
}

export class UnPriceMachineError extends BaseError {
  public readonly retry = false
  public readonly name = UnPriceMachineError.name

  constructor({ message }: { message: string }) {
    super({
      message: `Machine service error: ${message}`,
    })
  }
}
