import { UnPriceMachineError } from "#services/machine/errors"
import { db, eq, sql } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import { SUBSCRIPTION_STATUS } from "@unprice/db/utils"
import type { Customer, Subscription, SubscriptionStatus } from "@unprice/db/validators"
import { Err, Ok, type Result, wrapResult } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { type AnyActorRef, and, assign, createActor, createMachine, fromPromise, not } from "xstate"
import { logTransition, sendCustomerNotification, updateMetadataSubscription } from "./actions"
import {
  canInvoice,
  canRenew,
  hasValidPaymentMethod,
  isAlreadyInvoiced,
  isAlreadyRenewed,
  isAutoRenewEnabled,
  isTrialExpired,
} from "./guards"
import { invoiceSubscription, loadSubscription, renewSubscription } from "./invokes"
import type {
  MachineTags,
  SubscriptionActions,
  SubscriptionContext,
  SubscriptionEvent,
  SubscriptionGuards,
} from "./types"

/**
 * Subscription Manager
 *
 * Handles subscription lifecycle management using a state machine.
 * Supports trials, billing cycles, and plan changes.
 *
 * States:
 * - pending: Initial state before we determine the actual starting state
 * - trialing: Initial trial period
 * - active: Paid and active subscription
 * - past_due: Failed payment, awaiting resolution
 * - canceled: Terminated subscription
 * - expired: Final state for expired subscriptions
 */
export class SubscriptionMachine {
  private subscriptionId: string
  private projectId: string
  private analytics: Analytics
  private logger: Logger
  private actor!: AnyActorRef
  private waitUntil: (p: Promise<unknown>) => void

  private constructor({
    subscriptionId,
    projectId,
    analytics,
    logger,
    waitUntil,
  }: {
    subscriptionId: string
    projectId: string
    analytics: Analytics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
  }) {
    this.subscriptionId = subscriptionId
    this.projectId = projectId
    this.analytics = analytics
    this.logger = logger
    this.waitUntil = waitUntil
  }

  /**
   * Creates the state machine definition
   */
  private createMachineSubscription() {
    return createMachine(
      {
        id: "subscription",
        types: {} as {
          context: SubscriptionContext
          events: SubscriptionEvent
          guards: SubscriptionGuards
          actions: SubscriptionActions
          states: SubscriptionStatus
          tags: MachineTags
        },
        initial: "loading",
        context: {
          subscriptionId: this.subscriptionId,
          projectId: this.projectId,
          paymentMethodId: null,
          requiredPaymentMethod: false,
          phases: [],
          currentPhase: null,
          openInvoices: [],
          subscription: {} as Subscription,
          customer: {} as Customer,
        } as SubscriptionContext,
        output: ({ context }) => ({
          error: context.error,
          status: context.subscription?.status,
        }),
        states: {
          loading: {
            tags: ["machine"],
            description:
              "Loading the subscription. This is the initial state which is not reported to the database",
            invoke: {
              id: "loadSubscription",
              src: fromPromise(({ input }) => loadSubscription(input)),
              input: ({ context }) => ({ subscriptionId: context.subscriptionId }),
              onDone: {
                target: "restored",
                actions: [
                  assign({
                    subscription: ({ event }) => event.output.subscription,
                    phases: ({ event }) => event.output.phases,
                    currentPhase: ({ event }) => event.output.currentPhase,
                    customer: ({ event }) => event.output.customer,
                  }),
                  "logStateTransition",
                ],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ event }) => {
                    return event.error as Error
                  },
                }),
              },
            },
          },
          error: {
            tags: ["machine"],
            description: "Subscription error, it will throw an error as a final state",
            type: "final",
            entry: ({ context, event }) => {
              this.logger.error(context.error?.message ?? "Unknown error", {
                subscriptionId: this.subscriptionId,
                projectId: this.projectId,
                event,
              })

              // throw an error to be caught by the machine
              throw context.error
            },
          },
          restored: {
            description: "Subscription restored, transition to the correct state",
            tags: ["machine"],
            always: [
              {
                target: "trialing",
                guard: ({ context }) => context.subscription?.status === "trialing",
                actions: "logStateTransition",
              },
              {
                target: "active",
                guard: ({ context }) => context.subscription?.status === "active",
                actions: "logStateTransition",
              },
              {
                target: "past_due",
                guard: ({ context }) => context.subscription?.status === "past_due",
                actions: "logStateTransition",
              },
              {
                target: "canceled",
                guard: ({ context }) => context.subscription?.status === "canceled",
                actions: "logStateTransition",
              },
              {
                target: "expired",
                guard: ({ context }) => context.subscription?.status === "expired",
                actions: "logStateTransition",
              },
              {
                target: "error",
                guard: ({ context }) => context.error !== undefined,
                actions: "logStateTransition",
              },
            ],
          },
          trialing: {
            tags: ["subscription"],
            description: "Subscription is trialing",
            on: {
              TRIAL_END: [
                {
                  guard: and(["isTrialExpired", "hasValidPaymentMethod"]),
                  target: "ending_trial",
                  actions: "logStateTransition",
                },
                {
                  target: "error",
                  actions: assign({
                    error: () => ({
                      message:
                        "Cannot end trial, dates are not due yet or payment method is invalid",
                    }),
                  }),
                },
              ],
              CANCEL: {
                target: "canceled",
                actions: "logStateTransition",
              },
            },
          },
          ending_trial: {
            tags: ["subscription"],
            description: "Ending the trial invoice the subscription",
            invoke: {
              id: "invoiceSubscription",
              src: fromPromise(({ input }) => invoiceSubscription(input)),
              input: ({ context }) => ({ context, isTrialEnding: true }),
              onDone: {
                target: "invoiced",
                actions: [
                  assign({
                    subscription: ({ event }) => event.output.subscription,
                  }),
                  "logStateTransition",
                  "notifyCustomer",
                ],
              },
              onError: {
                target: "past_due",
                // update the metadata for the subscription to keep track of the reason
                actions: ({ context }) =>
                  updateMetadataSubscription({
                    context,
                    metadata: {
                      reason: "invoice_failed",
                      note: "Invoice failed after trial ended",
                    },
                  }),
              },
            },
          },
          invoicing: {
            tags: ["subscription"],
            description: "Invoicing the subscription depending on the whenToBill setting",
            invoke: {
              id: "invoiceSubscription",
              src: fromPromise(({ input }) => invoiceSubscription(input)),
              input: ({ context }) => ({ context }),
              onDone: {
                target: "invoiced",
                actions: [
                  assign({
                    subscription: ({ event }) => event.output.subscription,
                  }),
                  "logStateTransition",
                  "notifyCustomer",
                ],
              },
              onError: {
                target: "past_due",
                actions: [
                  // update the metadata for the subscription to keep track of the reason
                  ({ context }) =>
                    updateMetadataSubscription({
                      context,
                      metadata: {
                        reason: "invoice_failed",
                        note: "Invoice failed after invoicing",
                      },
                    }),
                  "logStateTransition",
                ],
              },
            },
          },
          invoiced: {
            tags: ["subscription"],
            description: "Subscription invoiced, ready to be renewed",
            on: {
              RENEW: [
                {
                  guard: "isAlreadyRenewed",
                  target: "active",
                  actions: "logStateTransition",
                },
                {
                  guard: and(["canRenew", "isAutoRenewEnabled"]),
                  target: "renewing",
                  actions: "logStateTransition",
                },
                {
                  guard: not("isAutoRenewEnabled"),
                  target: "expired",
                  actions: "logStateTransition",
                },
                {
                  target: "error",
                  actions: assign({
                    error: () => ({
                      message:
                        "Cannot renew subscription, dates are not due yet or auto renew is disabled",
                    }),
                  }),
                },
              ],
            },
          },
          renewing: {
            tags: ["subscription"],
            description: "Renewing the subscription, update billing dates",
            invoke: {
              id: "renew",
              src: fromPromise(({ input }) => renewSubscription(input)),
              input: ({ context }) => ({
                context,
              }),
              onDone: {
                target: "active",
                actions: [
                  assign({
                    subscription: ({ event }) => event.output.subscription,
                  }),
                  "logStateTransition",
                  "notifyCustomer",
                ],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ event }) => {
                    const err = event.error as Error
                    return {
                      message: err.message,
                    }
                  },
                }),
              },
            },
          },
          active: {
            tags: ["subscription"],
            description: "Subscription is active",
            on: {
              CANCEL: {
                target: "canceling",
                actions: "logStateTransition",
              },
              CHANGE: {
                target: "changing",
                actions: "logStateTransition",
              },
              PAYMENT_SUCCESS: {
                target: "active",
                actions: "logStateTransition",
              },
              PAYMENT_FAILURE: {
                target: "past_due",
                actions: "logStateTransition",
              },
              INVOICE: [
                {
                  guard: "isAlreadyInvoiced",
                  target: "invoiced",
                  actions: "logStateTransition",
                },
                {
                  guard: and(["canInvoice", "hasValidPaymentMethod"]),
                  target: "invoicing",
                  actions: "logStateTransition",
                },
                {
                  target: "error",
                  actions: assign({
                    error: () => ({
                      message:
                        "Cannot invoice subscription, payment method is invalid or subscription is not due to be invoiced",
                    }),
                  }),
                },
              ],
            },
          },
          past_due: {
            tags: ["subscription"],
            description: "Subscription is past due can retry payment or invoice",
            on: {
              PAYMENT_SUCCESS: {
                target: "active",
                guard: "hasValidPaymentMethod",
                actions: ["logStateTransition", "notifyCustomer"],
              },
              CANCEL: {
                target: "canceled",
                actions: "logStateTransition",
              },
              INVOICE: [
                {
                  guard: "isAlreadyInvoiced",
                  target: "invoiced",
                  actions: "logStateTransition",
                },
                {
                  guard: and(["canInvoice", "hasValidPaymentMethod"]),
                  target: "invoicing",
                  actions: "logStateTransition",
                },
                {
                  target: "error",
                  actions: assign({
                    error: () => ({
                      message:
                        "Cannot invoice subscription, payment method is invalid or subscription is not due to be invoiced",
                    }),
                  }),
                },
              ],
            },
          },
          canceling: {
            tags: ["subscription"],
            description: "Canceling the subscription, update billing dates",
          },
          changing: {
            tags: ["subscription"],
            description: "Changing the subscription, update billing dates",
          },
          expiring: {
            tags: ["subscription"],
            description: "Subscription expired, no more payments will be made",
            type: "final",
          },
          canceled: {
            tags: ["subscription"],
            type: "final",
            description: "Subscription canceled, no more payments will be made",
          },
          expired: {
            tags: ["subscription"],
            description: "Subscription expired, no more payments will be made",
            type: "final",
          },
        },
      },
      {
        guards: {
          isTrialExpired: isTrialExpired,
          canRenew: canRenew,
          hasValidPaymentMethod: hasValidPaymentMethod,
          canInvoice: canInvoice,
          isAlreadyRenewed: isAlreadyRenewed,
          isAutoRenewEnabled: isAutoRenewEnabled,
          isAlreadyInvoiced: isAlreadyInvoiced,
        },
        actions: {
          logStateTransition: ({ context, event }) =>
            logTransition({ context, event, logger: this.logger }),
          notifyCustomer: ({ context, event }) =>
            sendCustomerNotification({ context, event, logger: this.logger }),
        },
      }
    )
  }

  private async loadInitialState(): Promise<void> {
    const machine = this.createMachineSubscription()

    this.actor = createActor(machine, {
      input: { subscriptionId: this.subscriptionId, projectId: this.projectId },
    })

    // Subscribe to ALL state changes and persist them
    this.actor.subscribe({
      next: async (snapshot) => {
        const currentState = snapshot.value as SubscriptionStatus | "loading" | "restored"

        console.log("snapshot tags", snapshot.hasTag("subscription"))
        try {
          // Record state change in the database
          await db.transaction(async (tx) => {
            // only update the status if it's a valid subscription status
            if (SUBSCRIPTION_STATUS.includes(currentState as SubscriptionStatus)) {
              // Update subscription status
              await tx
                .update(subscriptions)
                .set({
                  status: currentState as SubscriptionStatus,
                  active: ["active", "renewing", "past_due", "ending_trial", "trialing"].includes(
                    currentState
                  ),
                })
                .where(eq(subscriptions.id, this.subscriptionId))
            }
          })
        } catch (error) {
          const err = error as Error
          this.logger.error(err.message ?? "Failed to persist state change", {
            code: "loadInitialState",
            subscriptionId: this.subscriptionId,
            projectId: this.projectId,
          })
        }
      },
    })

    // Start the actor and wait for initialization
    this.actor.start()

    // Wait for initialization to complete
    await this.waitForState({})
  }

  // very important to acquire the lock before starting the machine
  // so we can avoid race conditions when multiple machines are started at the same time
  private async acquireLock(): Promise<boolean> {
    try {
      // Convert the subscription ID to a bigint hash for the advisory lock
      // We need a numeric value for pg_advisory_lock
      const result = await db
        .execute<{ acquired: boolean }>(sql`
        SELECT pg_try_advisory_lock(('x' || substr(md5(${this.subscriptionId}), 1, 16))::bit(64)::bigint) as acquired
      `)
        .then((result) => result.rows[0])

      return result?.acquired === true
    } catch (error) {
      this.logger.error("Failed to acquire advisory lock", {
        subscriptionId: this.subscriptionId,
        error,
      })
      return false
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      await db.execute(sql`
        SELECT pg_advisory_unlock(('x' || substr(md5(${this.subscriptionId}), 1, 16))::bit(64)::bigint)
      `)
    } catch (error) {
      this.logger.error("Failed to release advisory lock", {
        subscriptionId: this.subscriptionId,
        error,
      })
    }
  }

  public static async create(payload: {
    subscriptionId: string
    projectId: string
    analytics: Analytics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
  }): Promise<Result<SubscriptionMachine, UnPriceMachineError>> {
    const subscription = new SubscriptionMachine(payload)

    // Try to acquire a lock before initializing
    const lockAcquired = await subscription.acquireLock()

    if (!lockAcquired) {
      payload.logger.info(
        "Could not acquire lock for subscription, another process is handling it",
        {
          subscriptionId: payload.subscriptionId,
        }
      )
      return Err(
        new UnPriceMachineError({
          message: "Could not acquire lock for subscription, another process is handling it",
        })
      )
    }

    try {
      await subscription.loadInitialState()

      return Ok(subscription)
    } catch (error) {
      // Release lock if initialization fails
      await subscription.releaseLock()
      return Err(error as UnPriceMachineError)
    }
  }

  public getState() {
    return this.actor.getSnapshot().value as SubscriptionStatus | "loading" | "restored"
  }

  private sendEvent(
    event: SubscriptionEvent
  ): Promise<Result<SubscriptionStatus | "loading" | "restored", UnPriceMachineError>> {
    // send the event to the actor
    this.actor.send(event)

    // wait for the event to be processed
    return this.waitForState({ event })
  }

  private async waitForState({
    event = undefined,
    timeout = 15000,
  }: { event?: SubscriptionEvent; timeout?: number }): Promise<
    Result<SubscriptionStatus | "loading" | "restored", UnPriceMachineError>
  > {
    // return a promise that resolves when the event is processed or times out
    const promise = new Promise<SubscriptionStatus | "loading" | "restored">((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.actor.stop()
        const errorMessage = `Event timed out: ${event?.type ?? "unknown event"}`
        reject(new Error(errorMessage))
      }, timeout)

      this.actor.subscribe({
        next: (snapshot) => {
          if (snapshot.matches("error")) {
            clearTimeout(timeoutId)
            const errorMessage = snapshot.context.error?.message ?? "Unknown state machine error"
            this.shutdown()
            reject(new Error(errorMessage))
            return
          }

          clearTimeout(timeoutId)
          resolve(snapshot.value as SubscriptionStatus | "loading" | "restored")
        },
        error: (error) => {
          clearTimeout(timeoutId)
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "object" && error && "message" in error
                ? String(error.message)
                : "Unknown error in state machine"

          this.shutdown()
          reject(new Error(errorMessage))
        },
      })
    })

    return wrapResult(promise, (err) => {
      return new UnPriceMachineError({ message: err.message })
    })
  }

  /**
   * Simplified endTrial method
   */
  public async endTrial(): Promise<
    Result<SubscriptionStatus | "loading" | "restored", UnPriceMachineError>
  > {
    return await this.sendEvent({ type: "TRIAL_END" })
  }

  /**
   * Renews the subscription for the next billing cycle
   */
  public async renew(): Promise<
    Result<SubscriptionStatus | "loading" | "restored", UnPriceMachineError>
  > {
    return await this.sendEvent({ type: "RENEW" })
  }

  public async shutdown(): Promise<void> {
    this.actor.stop()
    // Release the lock after the actor is stopped
    // could be the case the lambda is killed before the lock is released
    // so we need to release it asynchronously
    this.waitUntil(this.releaseLock())
  }
}
