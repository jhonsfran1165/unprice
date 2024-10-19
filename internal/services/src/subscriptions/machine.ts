import type {
  Subscription,
  SubscriptionPhaseExtended,
  SubscriptionStatus,
} from "@unprice/db/validators"
import { Err, Ok, wrapResult } from "@unprice/error"
import { StateMachine } from "../machine/service"
import { UnPriceSubscriptionError } from "./errors"
import tyErr, { } from pe
{ Database, TransactionDatabase } from "@unprice/db"

export type SubscriptionEventMap = {
  END_TRIAL: {
    payload: { date: number }
    result: { status: SubscriptionStatus }
    error: UnPriceSubscriptionError
  }
  ACTIVATE: {
    payload: { paymentMethod: string }
    result: { activatedAt: Date; nextBillingDate: Date }
    error: UnPriceSubscriptionError
  }
  INVOICE: {
    payload: { invoiceId: string; invoiceDate: number }
    result: { invoiceId: string }
    error: UnPriceSubscriptionError
  }
  UPDATE: {
    payload: {
      status: SubscriptionStatus
      updatedAt: number
    }
    result: { status: SubscriptionStatus }
    error: UnPriceSubscriptionError
  }
}

type SubscriptionExtended = Subscription & {
  phases: SubscriptionPhaseExtended[]
}

export class SubscriptionStateMachine extends StateMachine<
  SubscriptionStatus,
  SubscriptionEventMap,
  keyof SubscriptionEventMap
> {
  private readonly subscription: SubscriptionExtended
  private readonly db: Database | TransactionDatabase

  constructor({
    db,
    subscription,
  }: {
    db: Database | TransactionDatabase
    subscription: SubscriptionExtended
  }) {
    // initial state
    // should get this from the database
    super("trialing")

    this.subscription = subscription
    this.db = db

    this.addTransition({
      from: "trialing",
      to: "active",
      event: "END_TRIAL",
      onTransition: async (payload) => {
        // payload is typed as ActivateEvent['payload']
        console.log("Ending trial", payload)

        // for ending a trial we check if the subscription has already finished the trial
        // if it has, we check if the subscription is billed or not

        const activePhase = this.subscription.phases.find((phase) => phase.active)

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        if (payload.date > this.subscription.trialEndsAt) {
          if (this.subscription.status === "pending") {
            return Ok({ status: "active" })
          }

          return Ok({ status: "past_due" })
        }

        return await wrapResult(
          this.wait({
            subscriptionId: this.subscription.id,
            status: "active",
          }),
          (err) => new UnPriceSubscriptionError({ message: err.message })
        )
      },
      onSuccess: (result) => {
        console.log("Trial ended:", result)
      },
      onError: (error) => {
        console.error("Error ending trial:", error)
      },
    })

    this.addTransition({
      from: "trialing",
      to: "pending",
      event: "INVOICE",
      onTransition: async (payload) => {
        console.log("Invoice created:", payload)

        return Ok({
          status: "pending",
          invoiceId: payload.invoiceId,
        })
      },
      onSuccess: (result) => {
        console.log("Subscription pending:", result)
      },
      onError: (error) => {
        console.error("Error creating invoice:", error)
      },
    })

    this.addTransition({
      from: "trialing",
      to: "past_due",
      event: "INVOICE",
      onTransition: async (payload) => {
        console.log("Invoice created:", payload)

        return Ok({
          invoiceId: payload.invoiceId,
        })
      },
    })
  }

  protected async setState(state: SubscriptionStatus): Promise<void> {
    // save in database
    // update cache
    await this.wait(state, 1000)
  }

  // simulate a await promise
  async wait<T>(result?: T, ms = 2000): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(result as T), ms))
  }
}
