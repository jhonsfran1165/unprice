import { type BaseError, Err, type Result } from "@unprice/error"
import { UnPriceMachineError } from "./errors"

// Event map to define payload, result and error types per event
type EventMap<S extends string> = Record<
  string,
  {
    payload: unknown
    result: {
      status: S
      [key: string]: unknown
    }
    error: BaseError
  }
>

type InferPayload<S extends string, E extends EventMap<S>, A extends keyof E> = E[A]["payload"]
type InferResult<S extends string, E extends EventMap<S>, A extends keyof E> = E[A]["result"]
type InferError<S extends string, E extends EventMap<S>, A extends keyof E> = E[A]["error"]

export type TransitionDefinition<S extends string, E extends EventMap<S>, A extends keyof E> = {
  from: [S, ...S[]]
  to: [S, ...S[]]
  event: A
  onTransition: (
    payload: InferPayload<S, E, A>
  ) => Promise<Result<InferResult<S, E, A>, InferError<S, E, A>>>
  onSuccess?: (result: InferResult<S, E, A>) => Promise<void>
  onError?: (error: InferError<S, E, A>) => Promise<void>
}

export abstract class StateMachine<S extends string, E extends EventMap<S>, A extends keyof E> {
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
   * Check if a transition is possible from the current state to the target state given an event
   */
  public canTransition(event: A): boolean {
    return this.transitions.some((t) => t.event === event && t.from.includes(this.currentState))
  }

  /**
   * Add a transition to the state machine
   */
  public addTransition<T extends A>(transition: TransitionDefinition<S, E, T>): void {
    this.transitions.push(transition as unknown as TransitionDefinition<S, E, A>)
  }

  public async transition<T extends A>(
    action: T,
    payload: InferPayload<S, E, T>
  ): Promise<Result<InferResult<S, E, T>, InferError<S, E, T>>> {
    const transition = this.transitions.find(
      (t) => t.event === action && t.from.includes(this.currentState)
    ) as TransitionDefinition<S, E, T> | undefined

    if (!transition) {
      // More controlled error handling
      const errorMessage = `Invalid transition: ${String(action)} from ${String(this.currentState)}`
      console.error(errorMessage)
      return Err({ message: errorMessage } as InferError<S, E, T>)
    }

    try {
      const result = await transition.onTransition(payload)

      if (result.err) {
        transition.onError?.(result.err)
        return result
      }

      const resultValue = result.val

      if (!resultValue) {
        const errorMessage = `Invalid result: ${String(action)} from ${String(this.currentState)}`
        console.error(errorMessage)
        return Err({ message: errorMessage } as InferError<S, E, T>)
      }

      // Update the state machine's current state
      this.currentState = resultValue.status
      await transition.onSuccess?.(resultValue)

      return result
    } catch (error) {
      await transition.onError?.(new UnPriceMachineError({ message: (error as Error).message }))
      return Err(new UnPriceMachineError({ message: (error as Error).message }))
    }
  }
}
