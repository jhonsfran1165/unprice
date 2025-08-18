import type { Analytics } from "@unprice/analytics"
import { eq } from "@unprice/db"
import { subscriptions } from "@unprice/db/schema"
import type { Customer, Subscription, SubscriptionStatus } from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import {
  type AnyActorRef,
  type AnyMachineSnapshot,
  and,
  assign,
  createActor,
  fromPromise,
  not,
  setup,
} from "xstate"

import { db } from "@unprice/db"
import { UnPriceMachineError } from "./errors"

import { logTransition, sendCustomerNotification, updateSubscription } from "./actions"
import {
  canInvoice,
  canRenew,
  currentPhaseNull,
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
  SusbriptionMachineStatus,
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
  private now: number
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private machine: any
  // Add a promise to track pending state updates
  private pendingStateUpdate: Promise<void> | null = null
  private stateUpdateResolve: (() => void) | null = null

  private constructor({
    subscriptionId,
    projectId,
    analytics,
    logger,
    waitUntil,
    now,
  }: {
    subscriptionId: string
    projectId: string
    analytics: Analytics
    logger: Logger
    waitUntil: (p: Promise<unknown>) => void
    now: number
  }) {
    this.subscriptionId = subscriptionId
    this.projectId = projectId
    this.analytics = analytics
    this.logger = logger
    this.waitUntil = waitUntil
    this.now = now
    this.machine = this.createMachineSubscription()
  }

  /**
   * Creates the state machine definition
   */
  private createMachineSubscription() {
    return setup({
      types: {} as {
        context: SubscriptionContext
        events: SubscriptionEvent
        guards: SubscriptionGuards
        actions: SubscriptionActions
        states: SubscriptionStatus
        tags: MachineTags
        input: {
          now: number
          subscriptionId: string
          projectId: string
        }
      },
      actors: {
        loadSubscription: fromPromise(
          async ({ input }: { input: { context: SubscriptionContext; logger: Logger } }) => {
            const result = await loadSubscription({
              context: input.context,
              logger: input.logger,
            })

            return result
          }
        ),
        invoiceSubscription: fromPromise(
          async ({
            input,
          }: { input: { context: SubscriptionContext; isTrialEnding?: boolean } }) => {
            const result = await invoiceSubscription({
              context: input.context,
              isTrialEnding: input.isTrialEnding,
            })

            return result
          }
        ),
        renewSubscription: fromPromise(
          async ({ input }: { input: { context: SubscriptionContext } }) => {
            const result = await renewSubscription(input)

            return result
          }
        ),
      },
      guards: {
        isTrialExpired: isTrialExpired,
        canRenew: canRenew,
        hasValidPaymentMethod: hasValidPaymentMethod,
        canInvoice: canInvoice,
        isAlreadyRenewed: isAlreadyRenewed,
        isAutoRenewEnabled: isAutoRenewEnabled,
        isAlreadyInvoiced: isAlreadyInvoiced,
        currentPhaseNull: currentPhaseNull,
      },
      actions: {
        logStateTransition: ({ context, event }) =>
          logTransition({ context, event, logger: this.logger }),
        notifyCustomer: ({ context, event }) =>
          sendCustomerNotification({ context, event, logger: this.logger }),
      },
    }).createMachine({
      id: "subscriptionMachine",
      initial: "loading",
      context: ({ input }) =>
        ({
          now: input.now,
          subscriptionId: input.subscriptionId,
          projectId: input.projectId,
          paymentMethodId: null,
          requiredPaymentMethod: false,
          phases: [],
          currentPhase: null,
          openInvoices: [],
          subscription: {} as Subscription,
          customer: {} as Customer,
        }) as SubscriptionContext,
      output: ({ context }) => ({
        error: context.error,
        status: context.subscription?.status,
      }),
      states: {
        loading: {
          tags: ["machine", "loading"],
          description:
            "Loading the subscription. This is the initial state which is not reported to the database",
          invoke: {
            id: "loadSubscription",
            src: "loadSubscription",
            input: ({ context }) => ({
              context,
              logger: this.logger,
            }),
            onDone: {
              target: "restored",
              actions: [
                assign({
                  now: ({ event }) => event.output.now,
                  subscription: ({ event }) => event.output.subscription,
                  currentPhase: ({ event }) => event.output.currentPhase,
                  customer: ({ event }) => event.output.customer,
                  paymentMethodId: ({ event }) => event.output.paymentMethodId,
                  requiredPaymentMethod: ({ event }) => event.output.requiredPaymentMethod,
                }),
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
          tags: ["machine", "error"],
          description: "Subscription error, it will throw an error as a final state",
          type: "final",
          entry: ({ context, event }) => {
            this.logger.error(context.error?.message ?? "Unknown error", {
              subscriptionId: this.subscriptionId,
              projectId: this.projectId,
              now: this.now,
              event,
            })

            // throw an error to be caught by the machine
            throw context.error
          },
        },
        restored: {
          description: "Subscription restored, transition to the correct state",
          tags: ["machine", "loading"],
          always: [
            {
              target: "trialing",
              guard: ({ context }) => context.subscription.status === "trialing",
              actions: "logStateTransition",
            },
            {
              target: "active",
              guard: ({ context }) => context.subscription.status === "active",
              actions: "logStateTransition",
            },
            {
              target: "past_due",
              guard: ({ context }) => context.subscription.status === "past_due",
              actions: "logStateTransition",
            },
            {
              target: "canceled",
              guard: ({ context }) => context.subscription.status === "canceled",
              actions: "logStateTransition",
            },
            {
              target: "expired",
              guard: ({ context }) => context.subscription.status === "expired",
              actions: "logStateTransition",
            },
            {
              target: "invoiced",
              guard: ({ context }) => context.subscription.status === "invoiced",
              actions: "logStateTransition",
            },
            {
              target: "renewing",
              guard: ({ context }) => context.subscription.status === "renewing",
              actions: "logStateTransition",
            },
            {
              target: "invoicing",
              guard: ({ context }) => context.subscription.status === "invoicing",
              actions: "logStateTransition",
            },
            {
              target: "idle",
              guard: ({ context }) => context.subscription.status === "idle",
              actions: "logStateTransition",
            },
            {
              target: "ending_trial",
              guard: ({ context }) => context.subscription.status === "ending_trial",
              actions: "logStateTransition",
            },
            // if the subscription is in an unknown state, transition to error
            {
              target: "error",
              actions: [
                "logStateTransition",
                assign({
                  error: () => ({
                    message: "Subscription is in an unknown state",
                  }),
                }),
              ],
            },
          ],
        },
        // TODO:implement the idle state
        idle: {
          tags: ["subscription", "loading"],
          description: "Subscription is idle",
        },
        trialing: {
          tags: ["subscription", "trialing"],
          description: "Subscription is trialing",
          on: {
            TRIAL_END: [
              {
                guard: "currentPhaseNull",
                target: "error",
                actions: assign({
                  error: () => ({
                    message: "Subscription has no active phase",
                  }),
                }),
              },
              {
                guard: and(["isTrialExpired", "hasValidPaymentMethod"]),
                target: "ending_trial",
                actions: "logStateTransition",
              },
              {
                target: "error",
                actions: assign({
                  error: ({ context }) => {
                    const trialEndAt = context.currentPhase?.trialEndsAt

                    if (!trialEndAt) {
                      return {
                        message: "Subscription has no active phase",
                      }
                    }

                    const trialEndAtDate = new Date(trialEndAt).toLocaleString()

                    return {
                      message: `Cannot end trial, dates are not due yet or payment method is invalid at ${trialEndAtDate}`,
                    }
                  },
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
          tags: ["subscription", "trialing"],
          description: "Ending the trial invoice the subscription",
          invoke: {
            id: "invoiceSubscription",
            src: "invoiceSubscription",
            input: ({ context }) => ({ context, isTrialEnding: true }),
            onDone: {
              target: "invoiced",
              actions: [
                assign({
                  subscription: ({ event, context }) => {
                    if (event.output.subscription) {
                      return event.output.subscription
                    }

                    return context.subscription
                  },
                }),
                "logStateTransition",
                "notifyCustomer",
              ],
            },
            onError: {
              target: "past_due",
              // update the metadata for the subscription to keep track of the reason
              actions: ({ context }) =>
                updateSubscription({
                  context,
                  subscription: {
                    metadata: {
                      reason: "invoice_failed",
                      note: "Invoice failed after trial ended",
                    },
                  },
                }),
            },
          },
        },
        invoicing: {
          tags: ["subscription", "invoicing"],
          description: "Invoicing the subscription depending on the whenToBill setting",
          invoke: {
            id: "invoiceSubscription",
            src: "invoiceSubscription",
            input: ({ context }) => ({ context, isTrialEnding: false }),
            onDone: {
              target: "invoiced",
              actions: [
                assign({
                  subscription: ({ event, context }) => {
                    if (event.output.subscription) {
                      return event.output.subscription
                    }

                    return context.subscription
                  },
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
                  updateSubscription({
                    context,
                    subscription: {
                      metadata: {
                        reason: "invoice_failed",
                        note: "Invoice failed after trying to invoice",
                      },
                    },
                  }),
                "logStateTransition",
              ],
            },
          },
        },
        invoiced: {
          tags: ["subscription", "invoicing"],
          description: "Subscription invoiced, ready to be renewed",
          on: {
            RENEW: [
              {
                guard: "currentPhaseNull",
                target: "error",
                actions: assign({
                  error: () => ({
                    message: "Subscription has no active phase",
                  }),
                }),
              },
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
                  error: ({ context }) => {
                    const renewAt = new Date(context.subscription.renewAt).toLocaleString()

                    return {
                      message: `Cannot renew subscription, dates are not due yet or payment method is invalid at ${renewAt}`,
                    }
                  },
                }),
              },
            ],
          },
        },
        renewing: {
          tags: ["subscription", "renewing"],
          description: "Renewing the subscription, update billing dates",
          invoke: {
            id: "renewSubscription",
            src: "renewSubscription",
            input: ({ context }) => ({
              context,
            }),
            onDone: {
              target: "active",
              actions: [
                assign({
                  subscription: ({ event, context }) => {
                    if (event.output.subscription) {
                      return event.output.subscription
                    }

                    return context.subscription
                  },
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
          tags: ["subscription", "active"],
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
              actions: ["logStateTransition"],
            },
            PAYMENT_FAILURE: {
              target: "past_due",
              actions: [
                "logStateTransition",
                ({ event }) => {
                  // notify the customer or admin
                  console.info("Payment failed", event)
                },
              ],
            },
            INVOICE_SUCCESS: {
              target: "active",
              actions: ["logStateTransition"],
            },
            INVOICE_FAILURE: {
              target: "past_due",
              actions: [
                "logStateTransition",
                ({ event }) => {
                  // notify the customer or admin
                  console.info("Invoice failed", event)
                },
              ],
            },
            INVOICE: [
              {
                guard: "currentPhaseNull",
                target: "error",
                actions: assign({
                  error: () => ({
                    message: "Subscription has no active phase",
                  }),
                }),
              },
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
                  error: ({ context }) => {
                    const invoiceAt = new Date(context.subscription.invoiceAt).toLocaleString()

                    return {
                      message: `Cannot invoice subscription, payment method is invalid or subscription is not due to be invoiced at ${invoiceAt}`,
                    }
                  },
                }),
              },
            ],
          },
        },
        past_due: {
          tags: ["subscription", "active"],
          description: "Subscription is past due can retry payment or invoice",
          on: {
            PAYMENT_SUCCESS: {
              target: "active",
              actions: ["logStateTransition"],
            },
            PAYMENT_FAILURE: {
              target: "active",
              actions: [
                "logStateTransition",
                ({ event }) => {
                  console.info("Payment failed", event)
                },
              ],
            },
            INVOICE_FAILURE: {
              target: "past_due",
              actions: [
                "logStateTransition",
                ({ event }) => {
                  console.info("Invoice failed", event)
                },
              ],
            },
            INVOICE_SUCCESS: {
              target: "active",
              actions: ["logStateTransition"],
            },
            CANCEL: {
              target: "canceled",
              actions: "logStateTransition",
            },
            INVOICE: [
              {
                guard: "currentPhaseNull",
                target: "error",
                actions: assign({
                  error: () => ({
                    message: "Subscription has no active phase",
                  }),
                }),
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
                    message: "Cannot invoice subscription yet or payment method is invalid",
                  }),
                }),
              },
            ],
          },
        },
        canceling: {
          tags: ["subscription", "ending"],
          description: "Canceling the subscription, update billing dates",
        },
        changing: {
          tags: ["subscription", "ending"],
          description: "Changing the subscription, update billing dates",
        },
        expiring: {
          tags: ["subscription", "ending"],
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
    })
  }

  private async initialize(): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    this.actor = createActor(this.machine, {
      input: {
        subscriptionId: this.subscriptionId,
        projectId: this.projectId,
        now: this.now,
      },
    })

    // Subscribe to ALL state changes and persist them
    this.actor.subscribe({
      next: async (snapshot) => {
        const currentState = snapshot.value as SusbriptionMachineStatus

        try {
          // Create a new promise for this state update
          this.pendingStateUpdate = new Promise((resolve) => {
            this.stateUpdateResolve = resolve
          })

          // Record state change in the database
          await db.transaction(async (tx) => {
            // only update the status if it's a valid subscription status
            if (snapshot.hasTag("subscription")) {
              // Update subscription status
              await tx
                .update(subscriptions)
                .set({
                  status: currentState as SubscriptionStatus,
                  active: !["idle", "expired", "canceled"].includes(currentState),
                })
                .where(eq(subscriptions.id, this.subscriptionId))
                .returning() // Add returning to ensure the update completed
                .then((result) => {
                  if (!result.length) {
                    throw new Error("Failed to update subscription status")
                  }
                })
            }
          })

          // Resolve the pending state update
          if (this.stateUpdateResolve) {
            this.stateUpdateResolve()
            this.stateUpdateResolve = null
          }
        } catch (error) {
          const err = error as Error
          this.logger.error(err.message ?? "Failed to persist state change", {
            code: "loadInitialState",
            subscriptionId: this.subscriptionId,
            projectId: this.projectId,
            now: this.now,
            currentState,
          })

          // Make sure to resolve even on error
          if (this.stateUpdateResolve) {
            this.stateUpdateResolve()
            this.stateUpdateResolve = null
          }

          throw err
        }
      },
    })

    // Start the actor
    this.actor.start()

    // Wait for initialization to complete
    const result = await this.waitForState({ timeout: 5000, tag: "subscription" })

    if (result.err) {
      return Err(result.err)
    }

    return Ok(result.val)
  }

  private getNextEvents(snapshot: AnyMachineSnapshot) {
    return [...new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])]
  }

  public static async create(payload: {
    subscriptionId: string
    projectId: string
    analytics: Analytics
    logger: Logger
    now: number
    waitUntil: (p: Promise<unknown>) => void
  }): Promise<Result<SubscriptionMachine, UnPriceMachineError>> {
    const subscription = new SubscriptionMachine(payload)

    try {
      const result = await subscription.initialize()

      if (result.err) {
        return Err(result.err)
      }

      return Ok(subscription)
    } catch (error) {
      return Err(new UnPriceMachineError({ message: (error as Error).message ?? "Unknown error" }))
    }
  }

  public getState() {
    return this.actor.getSnapshot().value as SusbriptionMachineStatus
  }

  private async sendEvent(
    event: SubscriptionEvent,
    states?: SusbriptionMachineStatus[]
  ): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    const snapshot = this.actor.getSnapshot()
    const nextEvents = this.getNextEvents(snapshot)

    // Transition is not possible, return the current state
    if (!nextEvents.includes(event.type)) {
      return Err(
        new UnPriceMachineError({
          message: `Transition not possible from ${this.getState()} to ${event.type}`,
        })
      )
    }

    // send the event to the actor
    this.actor.send(event)

    // wait for the event to be processed
    const result = await this.waitForState({ event, states: states })

    // Wait for any pending state update to complete
    if (this.pendingStateUpdate) {
      await this.pendingStateUpdate
    }

    return result
  }

  private async waitForState({
    timeout = 5000,
    event,
    states,
    tag,
  }: {
    timeout?: number
    event?: SubscriptionEvent
    states?: SusbriptionMachineStatus[]
    tag?: MachineTags
  }): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    // First check if we're already in the desired state/tag
    const currentSnapshot = this.actor.getSnapshot()
    if (
      states?.includes(currentSnapshot.value as SusbriptionMachineStatus) ||
      (tag && currentSnapshot.hasTag(tag))
    ) {
      return Ok(currentSnapshot.value as SusbriptionMachineStatus)
    }

    return new Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>>((resolve) => {
      // biome-ignore lint/style/useConst: <explanation>
      let timeoutId: NodeJS.Timeout | undefined
      // biome-ignore lint/style/useConst: <explanation>
      let subscription: { unsubscribe: () => void } | undefined

      // Setup cleanup function
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (subscription) subscription.unsubscribe()
      }

      // Setup subscription first
      subscription = this.actor.subscribe({
        next: (snapshot) => {
          // Check for error state first
          if (snapshot.matches("error")) {
            cleanup()
            resolve(
              Err(
                new UnPriceMachineError({
                  message: snapshot.context.error?.message ?? "Unknown state machine error",
                })
              )
            )
            return
          }

          // Check if we've reached the desired state or tag
          if (
            states?.includes(snapshot.value as SusbriptionMachineStatus) ||
            (tag && snapshot.hasTag(tag))
          ) {
            cleanup()
            resolve(Ok(snapshot.value as SusbriptionMachineStatus))
          }
        },
        error: (error) => {
          cleanup()
          resolve(
            Err(
              new UnPriceMachineError({
                message:
                  error instanceof Error
                    ? error.message
                    : typeof error === "object" && error && "message" in error
                      ? String(error.message)
                      : "Unknown error in state machine",
              })
            )
          )
        },
        complete: () => {
          cleanup()
        },
      })

      // Setup timeout after subscription
      timeoutId = setTimeout(() => {
        cleanup()
        resolve(
          Err(
            new UnPriceMachineError({
              message: `Timeout waiting for state ${states?.join(", ") ?? "unknown"} or tag ${
                tag ?? "unknown"
              } after ${timeout}ms${event ? ` (event: ${event.type})` : ""}`,
            })
          )
        )
      }, timeout)
    })
  }

  /**
   * Simplified endTrial method
   */
  public async endTrial(): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent({ type: "TRIAL_END" }, ["invoiced", "past_due", "active"])
  }

  /**
   * Renews the subscription for the next billing cycle
   */
  public async renew(): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent({ type: "RENEW" }, ["active", "expired"])
  }

  public async invoice(): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent({ type: "INVOICE" }, ["invoiced"])
  }

  public async reportPaymentSuccess({
    invoiceId,
  }: {
    invoiceId: string
  }): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent({ type: "PAYMENT_SUCCESS", invoiceId }, ["active"])
  }

  public async reportPaymentFailure({
    invoiceId,
    error,
  }: {
    invoiceId: string
    error: string
  }): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent({ type: "PAYMENT_FAILURE", invoiceId, error }, ["past_due"])
  }

  public async reportInvoiceSuccess({
    invoiceId,
  }: {
    invoiceId: string
  }): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent(
      {
        type: "INVOICE_SUCCESS",
        invoiceId,
      },
      ["active"]
    )
  }

  public async reportInvoiceFailure({
    invoiceId,
    error,
  }: {
    invoiceId: string
    error: string
  }): Promise<Result<SusbriptionMachineStatus, UnPriceMachineError>> {
    return await this.sendEvent(
      {
        type: "INVOICE_FAILURE",
        invoiceId,
        error,
      },
      ["past_due"]
    )
  }

  public async shutdown(timeout = 5000): Promise<void> {
    if (this.pendingStateUpdate) {
      try {
        await Promise.race([
          this.pendingStateUpdate,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("State update timeout")), timeout)
          ),
        ])
      } catch (error) {
        this.logger.error("Failed to complete state update during shutdown", {
          error,
          subscriptionId: this.subscriptionId,
        })
      }
    }

    this.actor.stop()
  }
}
