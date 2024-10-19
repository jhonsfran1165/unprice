import { type BaseError, Err, type Result } from "@unprice/error"
import { UnPriceMachineError } from "./errors"

// Event map to define payload, result and error types per event
type EventMap = Record<
  string,
  {
    payload: unknown
    result: unknown
    error: BaseError
  }
>

type InferPayload<E extends EventMap, A extends keyof E> = E[A]["payload"]
type InferResult<E extends EventMap, A extends keyof E> = E[A]["result"]
type InferError<E extends EventMap, A extends keyof E> = E[A]["error"]

export type TransitionDefinition<S, E extends EventMap, A extends keyof E> = {
  from: S
  to: S
  event: A
  onTransition: (
    payload: InferPayload<E, A>
  ) => Promise<Result<InferResult<E, A>, InferError<E, A>>>
  onSuccess?: (result: InferResult<E, A>) => void
  onError?: (error: InferError<E, A>) => void
}

export abstract class StateMachine<S extends string, E extends EventMap, A extends keyof E> {
  private currentState: S
  private transitions: Array<TransitionDefinition<S, E, A>> = []

  constructor(initialState: S) {
    this.currentState = initialState
  }

  /**
   * Get the current state of the state machine
   */
  public getCurrentState(): S {
    return this.currentState
  }

  /**
   * Set the current state of the state machine
   */
  protected abstract setState(state: S): Promise<void>

  public canTransition(event: A): boolean {
    return this.transitions.some((t) => t.event === event && t.from === this.currentState)
  }

  public addTransition<T extends A>(transition: TransitionDefinition<S, E, T>): void {
    this.transitions.push(transition as unknown as TransitionDefinition<S, E, A>)
  }

  public async transition<T extends A>(
    action: T,
    payload: InferPayload<E, T>
  ): Promise<Result<InferResult<E, T>, InferError<E, T>>> {
    const transition = this.transitions.find(
      (t) => t.event === action && t.from === this.currentState
    ) as TransitionDefinition<S, E, T> | undefined

    if (!transition) {
      // More controlled error handling
      const errorMessage = `Invalid transition: ${String(action)} from ${String(this.currentState)}`
      console.error(errorMessage)
      return Err({ message: errorMessage } as InferError<E, T>)
    }

    try {
      const result = await transition.onTransition(payload)
      if (result.err) {
        transition.onError?.(result.err)
        return result
      }

      // Update the state machine's current state
      this.currentState = transition.to
      await this.setState(transition.to)

      transition.onSuccess?.(result.val)

      return result
    } catch (error) {
      transition.onError?.(new UnPriceMachineError({ message: (error as Error).message }))
      return Err(new UnPriceMachineError({ message: (error as Error).message }))
    }
  }
}
