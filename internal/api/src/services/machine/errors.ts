import { BaseError } from "@unprice/error"

export class UnPriceMachineError extends BaseError {
  public readonly retry = false
  public readonly name = UnPriceMachineError.name

  constructor({ message }: { message: string }) {
    super({
      message: `Machine service error: ${message}`,
    })
  }
}
