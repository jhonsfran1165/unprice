export type Callback =
  | ((...args: unknown[]) => Promise<void>)
  | ((...args: unknown[]) => void)
  | undefined

export interface ITransition<STATE, EVENT, CALLBACK> {
  fromState: STATE
  event: EVENT
  toState: STATE
  cb?: CALLBACK
}

export interface ILogger {
  error(...data: unknown[]): void
}

export class Transition<STATE, EVENT, CALLBACK> implements ITransition<STATE, EVENT, CALLBACK> {
  constructor(
    public fromState: STATE,
    public event: EVENT,
    public toState: STATE,
    public cb?: CALLBACK
  ) {}
}

export class StateMachine<
  STATE extends string | number | symbol,
  EVENT extends string | number | symbol,
  CALLBACK extends Record<EVENT, Callback> = Record<EVENT, Callback>,
> {
  private _current: STATE
  private transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[] = []

  constructor(
    initialState: STATE,
    private readonly logger: ILogger = console
  ) {
    this._current = initialState
  }

  addTransition(transition: ITransition<STATE, EVENT, CALLBACK[EVENT]>): void {
    const boundTransition: ITransition<STATE, EVENT, CALLBACK[EVENT]> = { ...transition }
    if (
      boundTransition.cb &&
      typeof boundTransition.cb === "function" &&
      !boundTransition.cb.name?.startsWith("bound ")
    ) {
      boundTransition.cb = boundTransition.cb.bind(this) as CALLBACK[EVENT]
    }
    this.transitions.push(boundTransition)
  }

  addTransitions(transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[]): void {
    transitions.forEach((transition) => this.addTransition(transition))
  }

  getState(): STATE {
    return this._current
  }

  can(event: EVENT): boolean {
    return this.transitions.some(
      (trans) => trans.fromState === this._current && trans.event === event
    )
  }

  getNextState(event: EVENT): STATE | undefined {
    const transition = this.transitions.find(
      (tran) => tran.fromState === this._current && tran.event === event
    )
    return transition?.toState
  }

  isFinal(): boolean {
    return this.transitions.every((trans) => trans.fromState !== this._current)
  }

  async dispatch<E extends EVENT>(
    event: E,
    ...args: Parameters<CALLBACK[E] extends (...args: any) => any ? CALLBACK[E] : never>
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const found = this.transitions.some((tran) => {
          if (tran.fromState === this._current && tran.event === event) {
            this._current = tran.toState
            if (tran.cb) {
              try {
                const p = tran.cb(...args)
                if (p instanceof Promise) {
                  p.then(resolve).catch((e: Error) => reject(e))
                } else {
                  resolve()
                }
              } catch (e) {
                this.logger.error("Exception caught in callback", e)
                reject(e)
              }
            } else {
              resolve()
            }
            return true
          }
          return false
        })

        if (!found) {
          const errorMessage = this.formatNoTransitionError(this._current, event)
          this.logger.error(errorMessage)
          reject(new Error(errorMessage))
        }
      }, 0)
    })
  }

  private formatNoTransitionError(fromState: STATE, event: EVENT): string {
    return `No transition: from ${String(fromState)} event ${String(event)}`
  }
}

// Helper function to create transitions
export function createTransition<STATE, EVENT, CALLBACK>(
  fromState: STATE,
  event: EVENT,
  toState: STATE,
  cb?: CALLBACK
): ITransition<STATE, EVENT, CALLBACK> {
  return new Transition(fromState, event, toState, cb)
}
