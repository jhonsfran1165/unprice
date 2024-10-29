import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import { invoices, subscriptionPhases, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import {
  type CalculatedPrice,
  type Customer,
  type InvoiceStatus,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionMetadata,
  type SubscriptionPhaseExtended,
  type SubscriptionPhaseMetadata,
  type SubscriptionStatus,
  calculatePricePerFeature,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { addDays } from "date-fns"
import { StateMachine } from "../machine/service"
import { PaymentProviderService } from "../payment-provider"
import { UnPriceSubscriptionError } from "./errors"

// all event operate with the now parameter which is the timestamp of the event
// this allows us to handle the events in a deterministic way
// also allow us to mock future events for testing purposes, like when we want to test the subscription renewal, invoices, etc
export type SubscriptionEventMap<S extends string> = {
  END_TRIAL: {
    payload: { now: number }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  CANCEL: {
    payload: { now: number; cancelAt?: number }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  INVOICE: {
    payload: { now: number }
    result: { invoiceId: string; status: S }
    error: UnPriceSubscriptionError
  }
  COLLECT_PAYMENT: {
    payload: { now: number; invoiceId: string; autoFinalize: boolean }
    result: { status: S; paymentStatus: InvoiceStatus; retries: number; invoiceId: string }
    error: UnPriceSubscriptionError
  }
  RENEW: {
    payload: { now: number }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
  CHANGE: {
    payload: {
      now: number
      planVersionId: string
    }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
}

export class SubscriptionStateMachine extends StateMachine<
  SubscriptionStatus,
  SubscriptionEventMap<SubscriptionStatus>,
  keyof SubscriptionEventMap<SubscriptionStatus>
> {
  private readonly activePhase: SubscriptionPhaseExtended
  private readonly subscription: Subscription
  private readonly customer: Customer
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly analytics: Analytics

  constructor({
    db,
    activePhase,
    subscription,
    customer,
    logger,
    analytics,
  }: {
    db: Database | TransactionDatabase
    activePhase: SubscriptionPhaseExtended
    subscription: Subscription
    customer: Customer
    logger: Logger
    analytics: Analytics
  }) {
    // initial state
    if (!activePhase.status) {
      throw new UnPriceSubscriptionError({ message: "Subscription phase has no status" })
    }

    super(activePhase.status)

    this.activePhase = activePhase
    this.subscription = subscription
    this.customer = customer
    this.db = db
    this.logger = logger
    this.analytics = analytics

    /*
     * END_TRIAL
     * validate dates and change status to past_due which is the state where the subscription is waiting for invoice
     */
    this.addTransition({
      from: ["trialing"],
      to: ["pending_invoice"],
      event: "END_TRIAL",
      onTransition: async (payload) => {
        // get the active phase - subscription only has one phase active at a time
        const activePhase = this.getActivePhase()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // check if the phase is active and trialing status
        if (!activePhase.active) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is not active" }))
        }

        // check if the trial has ended
        if (activePhase.trialEndsAt && activePhase.trialEndsAt > payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Trial not ended yet" }))
        }

        // end the trial
        const state = await this.syncState({
          state: "pending_invoice",
          phaseId: activePhase.id,
          active: true,
          subscriptionDates: {},
          metadataSubscription: {
            note: "Trial ended, waiting for invoice",
            reason: "invoice_pending",
          },
          metadataPhase: {
            note: "Trial ended, waiting for invoice",
            reason: "invoice_pending",
          },
        })

        if (state.err) {
          return Err(state.err)
        }

        return Ok({
          subscriptionId: this.subscription.id,
          phaseId: activePhase.id,
          status: "pending_invoice",
        })
      },
    })

    /*
     * INVOICE
     * create an invoice for the subscription phase
     * if the invoice is created successfully, the subscription phase will be set to past_due
     */
    this.addTransition({
      from: ["pending_invoice", "active"],
      to: ["past_due", "active"],
      event: "INVOICE",
      onTransition: async (payload) => {
        // get the active phase - subscription only has one phase active at a time
        const activePhase = this.getActivePhase()

        if (!activePhase) {
          return Err(
            new UnPriceSubscriptionError({
              message: "No active phase found, for date",
              context: { date: payload.now },
            })
          )
        }

        // create an invoice for the subscription phase
        // invoice can be created any time in the cycle, but only will be due at the end or start of the cycle
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        const dueAt = invoice.val.invoice.dueAt
        const pastDueAt = invoice.val.invoice.pastDueAt

        // if the invoice should be billed, we finalize it immediately
        if (dueAt >= payload.now) {
          const result = await this.finalizeInvoice({
            invoice: invoice.val.invoice,
            now: payload.now,
          })

          if (result.err) {
            return Err(result.err)
          }

          // update state to past_due so we can collect the payment
          // this normally happens when the invoice is created at the end of the cycle
          await this.syncState({
            state: "past_due",
            phaseId: activePhase.id,
            active: true,
            subscriptionDates: {
              pastDueAt: pastDueAt ?? undefined,
              lastInvoiceAt: payload.now,
              nextInvoiceAt: dueAt,
            },
          })

          return Ok({
            invoiceId: invoice.val.invoice.id,
            status: "past_due",
          })
        }

        // if not finalized now, the subscription is active
        await this.syncState({
          state: "active",
          phaseId: activePhase.id,
          active: true,
          subscriptionDates: {
            pastDueAt: pastDueAt ?? undefined,
            lastInvoiceAt: payload.now,
            nextInvoiceAt: dueAt,
          },
        })

        return Ok({
          invoiceId: invoice.val.invoice.id,
          status: "active",
        })
      },
    })

    /*
     * COLLECT_PAYMENT
     * collect the payment for the invoice
     */
    this.addTransition({
      from: ["past_due", "active"],
      to: ["active", "past_due"],
      event: "COLLECT_PAYMENT",
      onTransition: async (payload) => {
        let invoice = await this.getInvoice(payload.invoiceId)

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        // automatically finalize the invoice if it's draft
        if (invoice.status === "draft") {
          if (payload.autoFinalize) {
            const result = await this.finalizeInvoice({
              invoice,
              now: payload.now,
            })

            if (result.err) {
              return Err(result.err)
            }

            invoice = result.val.invoice
          } else {
            return Err(
              new UnPriceSubscriptionError({
                message: "Invoice is not finalized, cannot collect payment",
              })
            )
          }
        }

        const result = await this.collectInvoicePayment({
          invoice,
          now: payload.now,
        })

        if (result.err) {
          return Err(result.err)
        }

        // only paid and void invoices are considered successful
        const subscriptionState = ["paid", "void"].includes(result.val.status)
          ? "active"
          : "past_due"

        if (result.val.status === "paid") {
          // only update the state if the payment is successful
          await this.syncState({
            state: subscriptionState,
            phaseId: invoice.subscriptionPhaseId,
            active: true,
            subscriptionDates: {
              pastDueAt: result.val.pastDueAt,
            },
            metadataSubscription: {
              note: "Payment received, subscription is active",
              reason: "payment_received",
            },
            metadataPhase: {
              note: "Payment received, phase is active",
              reason: "payment_received",
            },
          })

          // wait for the payment
          return Ok({
            status: "active",
            paymentStatus: result.val.status,
            retries: result.val.retries,
            invoiceId: invoice.id,
          })
        }

        // waiting for the payment
        if (result.val.status === "waiting") {
          await this.syncState({
            state: subscriptionState,
            phaseId: invoice.subscriptionPhaseId,
            active: true,
            subscriptionDates: {
              pastDueAt: result.val.pastDueAt,
            },
            metadataSubscription: {
              note: "Waiting for payment",
              reason: "payment_pending",
            },
            metadataPhase: {
              note: "Waiting for payment",
              reason: "payment_pending",
            },
          })
        }

        // if failted we need to set the subscription to failed
        if (result.val.status === "failed") {
          await this.syncState({
            state: subscriptionState,
            phaseId: invoice.subscriptionPhaseId,
            active: true,
            subscriptionDates: {
              pastDueAt: result.val.pastDueAt,
            },
            metadataSubscription: {
              note: "Invoice failed payment",
              reason: "payment_failed",
            },
            metadataPhase: {
              note: "Invoice failed payment",
              reason: "payment_failed",
            },
          })
        }

        // wait for the payment
        return Ok({
          status: subscriptionState,
          paymentStatus: result.val.status,
          retries: result.val.retries,
          invoiceId: invoice.id,
        })
      },
    })

    /*
     * RENEW
     * renew the phase, set the new cycle for the subscription
     * if there are changes or cancellations, we avoid renewing
     * if the phase is not active, we cannot renew it
     * for phases with no auto renew, we need to set the expiration date if non defined
     */
    this.addTransition({
      from: ["active"],
      to: ["active", "expired"],
      event: "RENEW",
      onTransition: async (payload) => {
        // get active phase
        const activePhase = this.getActivePhase()
        const subscription = this.subscription
        const currentState = this.getCurrentState()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // check if the subscription is not scheduled to be changed, expired or canceled
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          // TODO: apply the change here
          return Err(new UnPriceSubscriptionError({ message: "Phase is changed, cannot renew" }))
        }

        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          // TODO: cancel the phase here
          return Err(new UnPriceSubscriptionError({ message: "Phase is canceled, cannot renew" }))
        }

        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          // TODO: expire the phase here
          return Err(new UnPriceSubscriptionError({ message: "Phase is expired, cannot renew" }))
        }

        // this is a redundancy check, but it's good to have. No subscription should be past due with active state
        if (subscription.pastDueAt && subscription.pastDueAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is past due, cannot renew" })
          )
        }

        // this is a redundancy check, but it's good to have. No phase should have an end date in the past
        if (activePhase.endAt && activePhase.endAt < payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Phase end date is in the past" }))
        }

        const autoRenew = activePhase.autoRenew

        if (!autoRenew) {
          // if the phase does not auto renew, we need to set the subscription to expired
          await this.syncState({
            state: "expired",
            phaseId: activePhase.id,
            active: false,
            // we set the expiration date of the subscription if non defined
            subscriptionDates: {
              expiresAt: subscription.expiresAt || subscription.currentCycleEndAt,
            },
            phaseDates: {
              endAt: subscription.expiresAt || subscription.currentCycleEndAt,
            },
            metadataSubscription: {
              note: "Phase does not auto renew, subscription is expired",
              reason: "no_auto_renew",
            },
            metadataPhase: {
              note: "Phase does not auto renew, subscription is expired",
              reason: "no_auto_renew",
            },
          })

          return Ok({
            status: "expired",
          })
        }

        // check if the subscription was already renewed
        // check the new cycle start and end dates are between now
        if (
          payload.now >= subscription.currentCycleStartAt &&
          payload.now <= subscription.currentCycleEndAt
        ) {
          return Ok({
            status: currentState,
          })
        }

        // calculate next billing cycle - if there is an end date the cylce will go from the start of the cycle to the end date
        const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
          currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
          billingCycleStart: activePhase.startCycle, // start day of the billing cycle
          billingPeriod: activePhase.planVersion?.billingPeriod ?? "month", // billing period
          endAt: activePhase.endAt ?? undefined, // end day of the billing cycle if any
        })

        const whenToBill = activePhase.whenToBill

        // renewing a phase implies setting the new cycle for the subscription
        await this.syncState({
          state: currentState,
          phaseId: activePhase.id,
          active: true,
          subscriptionDates: {
            previousCycleStartAt: subscription.currentCycleStartAt,
            previousCycleEndAt: subscription.currentCycleEndAt,
            currentCycleStartAt: cycleStart.getTime(),
            currentCycleEndAt: cycleEnd.getTime(),
            nextInvoiceAt:
              whenToBill === "pay_in_advance" ? cycleStart.getTime() : cycleEnd.getTime(),
            cancelAt: undefined,
            expiresAt: undefined,
            changeAt: undefined,
            pastDueAt: undefined,
          },
        })

        return Ok({
          status: currentState,
        })
      },
    })

    /*
     * CANCEL
     * cancel the phase in the given date, if the date is in the past the phase is canceled immediately
     */
    this.addTransition({
      from: ["active"],
      to: ["canceled", "active"],
      event: "CANCEL",
      onTransition: async (payload) => {
        // get active phase
        const activePhase = this.getActivePhase()
        const subscription = this.subscription
        const currentState = this.getCurrentState()
        // if no cancel at is provided, we cancel immediately
        const cancelAt = payload.cancelAt ?? Date.now()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
        }

        // cannot cancel a phase if the subscription is changing
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({
              message: "The subscription is changing, cannot cancel the phase",
            })
          )
        }

        // if cannot cancel a subscription that is expiring
        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is expiring, cannot cancel" })
          )
        }

        // if the phase is already canceling don't do anything
        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Ok({
            status: currentState,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // if the cancel at is now we applied changes immediately
        if (cancelAt <= payload.now) {
          // here the phase has to be canceled immediately because the subscription is active and the date is in the past
          // we set the dates to invoice the phase for the current cycle
          // we don't set the state until the invoice is created and finalized
          await this.syncState({
            phaseId: activePhase.id,
            subscriptionDates: {
              cancelAt,
              // the next invoice is the cancel at date
              nextInvoiceAt: cancelAt,
            },
            phaseDates: {
              endAt: cancelAt,
            },
            metadataSubscription: {
              note: "Phase is being canceled, waiting for invoice and payment",
              reason: "pending_cancellation",
            },
            metadataPhase: {
              note: "Phase is being canceled, waiting for invoice and payment",
              reason: "pending_cancellation",
            },
          })

          // create an invoice for the subscription phase
          // invoice can be created any time in the cycle, but only will be due at the end or start of the cycle
          const invoice = await this.createInvoiceSubscriptionActivePhase({
            now: payload.now,
          })

          if (invoice.err) {
            return Err(invoice.err)
          }

          // finalize the invoice
          const result = await this.finalizeInvoice({
            invoice: invoice.val.invoice,
            now: payload.now,
          })

          if (result.err) {
            return Err(result.err)
          }

          // collect the payment
          const payment = await this.collectInvoicePayment({
            invoice: invoice.val.invoice,
            now: payload.now,
          })

          if (payment.err) {
            return Err(payment.err)
          }

          const isPaid = payment.val.status === "paid" || payment.val.status === "void"
          const note = isPaid
            ? "Payment received, phase is canceled"
            : "Waiting for payment, phase is canceled"
          const reason = isPaid ? "payment_received" : "payment_pending"

          // we cancel the subscription right away and the user will be notified for the unpaid invoice
          // if any. Normally this will be done manually by the admin
          await this.syncState({
            state: "canceled",
            phaseId: activePhase.id,
            active: false,
            subscriptionDates: {
              canceledAt: Date.now(),
            },
            metadataSubscription: {
              note,
              reason,
            },
            metadataPhase: {
              note,
              reason,
            },
          })

          return Ok({
            status: "canceled",
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // if the cancel at is in the future we set the cancel at in the subscription
        await this.syncState({
          state: currentState,
          phaseId: activePhase.id,
          active: true, // the phase is still active
          subscriptionDates: {
            cancelAt,
            // the next invoice is the cancel at date
            nextInvoiceAt: cancelAt,
          },
          phaseDates: {
            endAt: cancelAt,
          },
          metadataSubscription: {
            note: "Phase is being canceled, waiting for date to be reached",
            reason: "pending_cancellation",
          },
          metadataPhase: {
            note: "Phase is being canceled, waiting for date to be reached",
            reason: "pending_cancellation",
          },
        })

        return Ok({
          status: currentState,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })
  }

  private async syncState({
    state,
    active = true,
    subscriptionDates,
    metadataSubscription,
    phaseDates,
    metadataPhase,
  }: {
    state?: SubscriptionStatus
    active?: boolean
    phaseId: string
    subscriptionDates: Partial<{
      previousCycleStartAt: number
      previousCycleEndAt: number
      currentCycleStartAt: number
      currentCycleEndAt: number
      nextInvoiceAt: number
      lastInvoiceAt: number
      pastDueAt: number
      cancelAt: number
      canceledAt: number
      changeAt: number
      changedAt: number
      expiresAt: number
      expiredAt: number
    }>
    phaseDates?: Partial<{
      startAt: number
      endAt: number
    }>
    metadataSubscription?: SubscriptionMetadata
    metadataPhase?: SubscriptionPhaseMetadata
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    const activePhase = this.getActivePhase()

    if (!activePhase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    try {
      return await this.db.transaction(async (tx) => {
        // update the subscription status
        await tx
          .update(subscriptions)
          .set({
            status: state ?? this.subscription.status,
            active: active ?? this.subscription.active,
            // update the subscription dates
            ...subscriptionDates,
            metadata: metadataSubscription ?? this.subscription.metadata,
          })
          .where(eq(subscriptions.id, this.subscription.id))
          .catch((e) => {
            console.error("Error updating subscription status:", e)
            tx.rollback()
          })

        // update the subscription phase status
        await tx
          .update(subscriptionPhases)
          .set({
            status: state ?? activePhase.status,
            active: active ?? activePhase.active,
            ...phaseDates,
            metadata: metadataPhase ?? activePhase.metadata,
          })
          .where(
            and(
              eq(subscriptionPhases.subscriptionId, this.subscription.id),
              eq(subscriptionPhases.id, activePhase.id)
            )
          )
          .catch((e) => {
            console.error("Error updating subscription phase status:", e)
            tx.rollback()
          })

        return Ok(undefined)
      })
    } catch (e) {
      const error = e as Error
      return Err(
        new UnPriceSubscriptionError({
          message: `Error updating subscription status: ${error.message}`,
        })
      )
    }
  }

  private getActivePhase(): SubscriptionPhaseExtended {
    return this.activePhase
  }

  private async getInvoice(invoiceId: string): Promise<SubscriptionInvoice | undefined> {
    const invoice = await this.db.query.invoices.findFirst({
      where: (table, { eq }) => eq(table.id, invoiceId),
    })

    return invoice
  }

  private async getPendingPhaseInvoice({
    phaseId,
    startAt,
    endAt,
  }: {
    phaseId: string
    startAt: number
    endAt: number
  }): Promise<SubscriptionInvoice | undefined> {
    const pendingInvoice = await this.db.query.invoices.findFirst({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionPhaseId, phaseId),
          eq(table.cycleStartAt, startAt),
          eq(table.cycleEndAt, endAt),
          inArray(table.status, ["draft", "unpaid"])
        ),
    })

    return pendingInvoice
  }

  private async createInvoiceSubscriptionActivePhase(payload: {
    now: number
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    // the main idea creating an invoice is having a record we can work with even if the phase changes
    const now = payload.now
    const subscription = this.subscription
    const startAt = subscription.currentCycleStartAt
    const endAt = subscription.currentCycleEndAt
    const phase = this.getActivePhase()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    const customer = this.customer
    const planVersion = phase.planVersion
    // state of the subscription can change and this gave us the current state of the machine
    const currentState = this.getCurrentState()

    // check if the phase is active and invoicing status
    if (!phase.active || !["pending_invoice", "active"].includes(currentState)) {
      return Err(new UnPriceSubscriptionError({ message: "Phase is not active or not invoicing" }))
    }

    // check if the subscription should be invoiced with the given dates
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Subscription not ready to be invoiced" }))
    }

    // check if the given date is between the start and end of the cycle
    if (now < startAt || now > endAt) {
      return Err(
        new UnPriceSubscriptionError({ message: "Given date is not between the cycle dates" })
      )
    }

    // first of we need to verify there isn't a pending invoice for this phase - if so we need to use it
    const pendingInvoice = await this.getPendingPhaseInvoice({
      phaseId: phase.id,
      startAt,
      endAt,
    })

    let invoiceId = newId("invoice")

    if (pendingInvoice?.id) {
      invoiceId = pendingInvoice.id as `inv_${string}`
    }

    const paymentProviderService = new PaymentProviderService({
      customer: customer,
      paymentProviderId: planVersion.paymentProvider,
      logger: this.logger,
    })

    // check if the subscription requires a payment method and if the customer hasn't one
    const requiredPaymentMethod = planVersion.paymentMethodRequired
    const { err, val: paymentMethodId } = await paymentProviderService.getDefaultPaymentMethodId()

    if (err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting default payment method: ${err.message}`,
        })
      )
    }

    if (requiredPaymentMethod && !paymentMethodId) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Customer has no payment method",
          context: {
            phaseId: phase.id,
            customerId: customer.id,
          },
        })
      )
    }

    const whenToBill = phase.whenToBill
    const collectionMethod = phase.collectionMethod

    // calculate when to bill - if the subscription is pay in advance, the due date is the start of the cycle
    // if the subscription is pay in arrear, the due date is the end of the cycle
    const dueAt =
      whenToBill === "pay_in_advance"
        ? subscription.currentCycleStartAt
        : subscription.currentCycleEndAt
    // calculate the grace period based on the due date
    // this is when the invoice will be considered past due after that if not paid we can end it, cancel it, etc.
    const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()

    // When we filinze the invoice we set the total, invoice url and invoice id
    // so we can invoice the client from the past cycles for usage charges + flat charges for the current cycle
    // this only happens if the subscription is billed at the beggining of the cycle
    // for subscriptions billed at the end of the cycle, we sum up flat charges with usage charges for the current cycle

    // create the invoice, if there is a pending invoice we will use it, otherwise we will create a new one
    const invoice = await this.db
      .insert(invoices)
      .values({
        id: invoiceId,
        subscriptionId: subscription.id,
        subscriptionPhaseId: phase.id,
        cycleStartAt: startAt,
        cycleEndAt: endAt,
        status: "draft",
        // this allows us to know when to bill the invoice, when to get usage from past cycles
        whenToBill,
        dueAt,
        pastDueAt,
        total: "0", // this will be updated when the invoice is finalized
        invoiceUrl: "", // this will be updated when the invoice is finalized
        invoiceId: "", // this will be updated when the invoice is finalized
        paymentProvider: planVersion.paymentProvider,
        requiredPaymentMethod: requiredPaymentMethod,
        projectId: subscription.projectId,
        collectionMethod,
        currency: planVersion.currency,
        previousCycleStartAt: subscription.currentCycleStartAt,
        previousCycleEndAt: subscription.currentCycleEndAt,
      })
      .onConflictDoNothing()
      .returning()
      .then((res) => res[0])
      .catch((e) => {
        this.logger.error("Error creating invoice:", e)
        return undefined
      })

    if (!invoice) {
      return Err(new UnPriceSubscriptionError({ message: "Error creating invoice" }))
    }

    return Ok({
      invoice,
    })
  }

  private async finalizeInvoice(payload: {
    invoice: SubscriptionInvoice
    now: number
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now } = payload

    // invoices can be finilize after due date
    // we need to check if the invoice is due and if it is, we need to finalize it
    // if the invoice is not due, we need to return an error
    if (invoice.dueAt && invoice.dueAt > now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is not due yet, cannot finalize" })
      )
    }

    // check if the invoice is already finalized
    if (invoice.status !== "draft") {
      return Ok({ invoice })
    }

    const {
      paymentProvider,
      currency,
      metadata,
      collectionMethod,
      cycleStartAt,
      cycleEndAt,
      requiredPaymentMethod,
    } = invoice

    const paymentProviderInvoiceData = {
      invoiceId: "",
      invoiceUrl: "",
      total: 0,
    }

    const paymentProviderService = new PaymentProviderService({
      paymentProviderId: paymentProvider,
      customer: this.customer,
      logger: this.logger,
    })

    const defaultPaymentMethodId = await paymentProviderService.getDefaultPaymentMethodId()

    if (defaultPaymentMethodId.err) {
      return Err(new UnPriceSubscriptionError({ message: defaultPaymentMethodId.err.message }))
    }

    // check if the customer has a payment method and the invoice requires it
    if (requiredPaymentMethod && !defaultPaymentMethodId.val.paymentMethodId) {
      return Err(new UnPriceSubscriptionError({ message: "Customer has no payment method" }))
    }

    const paymentProviderInvoice = await paymentProviderService.createInvoice({
      currency,
      customerName: this.customer.name,
      email: this.customer.email,
      startCycle: cycleStartAt,
      endCycle: cycleEndAt,
      collectionMethod,
      // TODO: change this to the correct description
      description: metadata?.note ?? "Invoice for the cycle from...",
    })

    if (paymentProviderInvoice.err) {
      return Err(new UnPriceSubscriptionError({ message: "Error creating stripe invoice" }))
    }

    // calculate the price of the invoice items
    const invoiceItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
      invoice,
    })

    if (invoiceItemsPrice.err) {
      return Err(new UnPriceSubscriptionError({ message: "Error calculating invoice items price" }))
    }

    // create the invoice items in the payment provider
    for (const item of invoiceItemsPrice.val.items) {
      // depending on the payment provider, the amount is in different unit
      const formattedAmount = paymentProviderService.formatAmount(item.price.unitPrice.dinero)

      if (formattedAmount.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error formatting amount: ${formattedAmount.err.message}`,
          })
        )
      }

      // get the total amount of the invoice
      paymentProviderInvoiceData.total += formattedAmount.val.amount

      // update the invoice with the items price
      const itemInvoice = await paymentProviderService.addInvoiceItem({
        invoiceId: paymentProviderInvoice.val.invoiceId,
        name: item.productSlug,
        productId: item.productId,
        isProrated: item.isProrated,
        amount: formattedAmount.val.amount,
        quantity: item.quantity,
        currency: invoice.currency,
      })

      if (itemInvoice.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error adding invoice item: ${itemInvoice.err.message}`,
          })
        )
      }
    }

    paymentProviderInvoiceData.invoiceId = paymentProviderInvoice.val.invoiceId
    paymentProviderInvoiceData.invoiceUrl = paymentProviderInvoice.val.invoiceUrl

    // if all goes well, update the invoice with the payment provider invoice data
    // and set the status to unpaid so we can collect the payment
    const updatedInvoice = await this.db
      .update(invoices)
      .set({
        invoiceId: paymentProviderInvoiceData.invoiceId,
        invoiceUrl: paymentProviderInvoiceData.invoiceUrl,
        total: paymentProviderInvoiceData.total.toString(),
        status: "unpaid",
      })
      .where(eq(invoices.id, invoice.id))
      .returning()
      .then((res) => res[0])

    if (!updatedInvoice) {
      return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
    }

    // bill the invoice
    return Ok({ invoice: updatedInvoice })
  }

  private async collectInvoicePayment(payload: {
    invoice: SubscriptionInvoice
    now: number
  }): Promise<
    Result<
      { status: InvoiceStatus; retries: number; pastDueAt: number | undefined },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now } = payload
    let result: InvoiceStatus = "waiting"

    // TODO: how to handle multiple invoices?
    const { collectionMethod, paymentProvider, invoiceId, status, paymentAttempts, pastDueAt } =
      invoice

    const paymentProviderService = new PaymentProviderService({
      paymentProviderId: paymentProvider,
      customer: this.customer,
      logger: this.logger,
    })

    // check if the invoice is due
    if (invoice.dueAt && invoice.dueAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice is not due yet" }))
    }

    // check if the invoice is already paid
    if (["paid", "void"].includes(invoice.status)) {
      return Ok({ status: invoice.status, retries: paymentAttempts?.length ?? 0, pastDueAt })
    }

    // if the invoice is draft, we don't need to collect the payment
    if (status === "draft") {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is draft, cannot collect payment" })
      )
    }

    // by this point the invoice is closed and it should have an invoice id
    if (!invoiceId) {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is closed, but has no invoice id" })
      )
    }

    // if the invoice is failed, we don't need to collect the payment
    if (status === "failed") {
      // meaning the invoice is past due and we cannot collect the payment with 3 attempts
      return Ok({ status: "failed", retries: paymentAttempts?.length ?? 0, pastDueAt })
    }

    // here the invoice should be closed which means the invoice is defined
    // if the invoice is waiting, we need to check if the payment is successful
    if (status === "waiting") {
      // check the status of the payment in the provider
      const statusInvoice = await paymentProviderService.getStatusInvoice({
        invoiceId: invoiceId,
      })

      if (statusInvoice.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error getting invoice status" }))
      }

      if (statusInvoice.val.status === "paid" || statusInvoice.val.status === "void") {
        // update the invoice status
        const updatedInvoice = await this.db
          .update(invoices)
          .set({
            status: statusInvoice.val.status,
            paidAt: statusInvoice.val.paidAt,
            invoiceUrl: statusInvoice.val.invoicePdf,
            paymentAttempts: [...(paymentAttempts ?? []), ...statusInvoice.val.paymentAttempts],
          })
          .where(eq(invoices.id, invoice.id))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
        }

        return Ok({
          status: statusInvoice.val.status,
          retries: updatedInvoice.paymentAttempts?.length ?? 0,
          pastDueAt,
        })
      }

      return Ok({ status: "waiting", retries: paymentAttempts?.length ?? 0, pastDueAt })
    }

    // 3 attempts max
    if (paymentAttempts?.length && paymentAttempts.length >= 3) {
      // update the invoice status
      await this.db
        .update(invoices)
        .set({ status: "failed", pastDueAt: Date.now() })
        .where(eq(invoices.id, invoice.id))

      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice has reached the maximum number of payment attempts",
        })
      )
    }

    const defaultPaymentMethodId = await paymentProviderService.getDefaultPaymentMethodId()

    if (defaultPaymentMethodId.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting default payment method: ${defaultPaymentMethodId.err.message}`,
        })
      )
    }

    // collect the payment depending on the collection method
    // collect automatically means we will try to collect the payment with the default payment method
    if (collectionMethod === "charge_automatically") {
      const stripePaymentInvoice = await paymentProviderService.collectPayment({
        invoiceId: invoiceId,
        paymentMethodId: defaultPaymentMethodId.val.paymentMethodId,
      })

      if (stripePaymentInvoice.err) {
        // update the attempt if the payment failed
        await this.db
          .update(invoices)
          .set({
            // set the intempts to failed
            paymentAttempts: [
              ...(paymentAttempts ?? []),
              { status: "failed", createdAt: Date.now() },
            ],
          })
          .where(eq(invoices.id, invoice.id))

        return Err(
          new UnPriceSubscriptionError({
            message: `Error collecting payment: ${stripePaymentInvoice.err.message}`,
          })
        )
      }

      // update the invoice status if the payment is successful
      await this.db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: Date.now(),
          paymentAttempts: [...(paymentAttempts ?? []), { status: "paid", createdAt: Date.now() }],
        })
        .where(eq(invoices.id, invoice.id))

      result = "paid"
    } else if (collectionMethod === "send_invoice") {
      const stripeSendInvoice = await paymentProviderService.sendInvoice({
        invoiceId: invoiceId,
      })

      if (stripeSendInvoice.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error sending invoice: ${stripeSendInvoice.err.message}`,
          })
        )
      }

      // update the invoice status if send invoice is successful
      await this.db
        .update(invoices)
        .set({
          status: "waiting",
          // add the sent attempt
          paymentAttempts: [...(paymentAttempts ?? []), { status: "sent", createdAt: Date.now() }],
          sentAt: Date.now(),
          metadata: {
            ...(invoice.metadata ?? {}),
            note: "Invoice sent to the customer",
          },
        })
        .where(eq(invoices.id, invoice.id))

      // this is a manual payment and we check with background job if the payment is successful
      result = "waiting"
    }

    return Ok({ status: result, retries: paymentAttempts?.length ?? 0, pastDueAt })
  }

  private async calculateSubscriptionActivePhaseItemsPrice(payload: {
    invoice: SubscriptionInvoice
  }): Promise<
    Result<
      {
        items: {
          productId: string
          price: CalculatedPrice
          quantity: number
          isProrated: boolean
          productSlug: string
        }[]
      },
      UnPriceSubscriptionError
    >
  > {
    const { cycleStartAt, cycleEndAt, previousCycleStartAt, previousCycleEndAt, whenToBill } =
      payload.invoice
    const phase = this.getActivePhase()
    const subscription = this.subscription
    // when billing in advance we calculate flat price for the current cycle + usage from the past cycles
    // when billing in arrear we calculate usage for the current cycle + flat price from the past cycles
    const shouldBillInAdvance = whenToBill === "pay_in_advance"

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    // calculate proration for the current billing cycle
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      currentCycleStartAt: cycleStartAt,
      billingCycleStart: cycleStartAt,
      billingPeriod: phase.planVersion?.billingPeriod ?? "month",
    })

    const proration = calculatedCurrentBillingCycle.prorationFactor
    const invoiceItems = []

    // we bill the subscriptions items attached to the phase, that way if the customer changes the plan,
    // we create a new phase and bill the new plan and there are no double charges for the same feature in past cycles
    // also this give us the flexibility to add new features to the plan without affecting the past invoices
    // we called that custom entitlements (outside of the subscription)

    try {
      // create an invoice item for each feature
      for (const item of phase.items) {
        let prorate = proration

        // proration is supported for fixed cost items - not for usage
        if (item.featurePlanVersion.featureType === "usage") {
          prorate = 1
        }

        // calculate the quantity of the feature
        let quantity = 0

        // get the usage depending on the billing type
        // when billing at the end of the cycle we get the usage for the current cycle + fixed price from current cycle
        if (!shouldBillInAdvance) {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (item.featurePlanVersion.featureType !== "usage") {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            const usage = await this.analytics
              .getTotalUsagePerFeature({
                featureSlug: item.featurePlanVersion.feature.slug,
                subscriptionPhaseId: phase.id,
                subscriptionItemId: item.id,
                projectId: subscription.projectId,
                customerId: this.customer.id,
                // get usage for the current cycle
                start: cycleStartAt,
                end: cycleEndAt,
              })
              .then((usage) => usage.data[0])

            const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

            quantity = units
          }
        } else {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (item.featurePlanVersion.featureType !== "usage") {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            // get usage for the previous cycle -> previous cycle could be undefined if the customer has not been billed yet
            // and this is the first invoice
            if (previousCycleStartAt && previousCycleEndAt) {
              // get usage for the current cycle
              const usage = await this.analytics
                .getTotalUsagePerFeature({
                  featureSlug: item.featurePlanVersion.feature.slug,
                  projectId: subscription.projectId,
                  subscriptionPhaseId: phase.id,
                  subscriptionItemId: item.id,
                  customerId: this.customer.id,
                  start: previousCycleStartAt,
                  end: previousCycleEndAt,
                })
                .then((usage) => usage.data[0])

              const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

              quantity = units
            }
          }
        }

        // this should never happen but we add a check anyway just in case
        // if the feature is not usage then the quantity is the number of units they bought in the subscription
        if (quantity < 0) {
          throw new Error(
            `quantity is negative ${item.id} ${item.featurePlanVersion.feature.slug} ${quantity}`
          )
        }

        // calculate the price depending on the type of feature
        const priceCalculation = calculatePricePerFeature({
          feature: item.featurePlanVersion,
          quantity: quantity,
          prorate: prorate,
        })

        if (priceCalculation.err) {
          throw new Error(
            `Error calculating price for ${item.featurePlanVersion.feature.slug} ${JSON.stringify(
              priceCalculation.err
            )}`
          )
        }

        // create an invoice item for each feature
        invoiceItems.push({
          quantity,
          productId: item.featurePlanVersion.feature.id,
          price: priceCalculation.val,
          productSlug: item.featurePlanVersion.feature.slug,
          isProrated: prorate !== 1,
        })
      }

      return Ok({
        items: invoiceItems,
      })
    } catch (e) {
      const error = e as Error
      return Err(new UnPriceSubscriptionError({ message: error.message }))
    }
  }

  public async renewSubscription(payload: { now: number }): Promise<
    Result<{ status: SubscriptionStatus }, UnPriceSubscriptionError>
  > {
    const currentState = this.getCurrentState()
    const { now } = payload
    const shouldAutoRenew = this.getActivePhase().autoRenew

    if (shouldAutoRenew) {
      const renew = await this.transition("RENEW", { now })

      if (renew.err) {
        return Err(renew.err)
      }

      return Ok({
        status: renew.val.status,
      })
    }

    // TODO: should I auto expired the subscription if not auto renew?
    return Ok({
      status: currentState,
    })
  }

  public async endTrial(payload: { now: number }): Promise<
    Result<{ status: string }, UnPriceSubscriptionError>
  > {
    // set the subscription to active
    const { now } = payload
    const currentState = this.getCurrentState()

    // every transition is idempotent and will not change the state if it is already in the desired state
    // here we need to ensure retries so if the transition chain fails and the subscription is in a middle state
    // we can continue from where we left off
    // The process is the following:
    // 1. End trial trailing -> trailing
    // 2. Invoice invoicing -> past_due
    // 3. Finalize past_due -> past_due
    // 4. Collect payment past_due -> active
    // 5. Renew subscription active -> active

    if (currentState === "trialing") {
      // continue from end trial
      const endTrial = await this.transition("END_TRIAL", { now })

      if (endTrial.err) {
        return Err(endTrial.err)
      }

      const invoice = await this.transition("INVOICE", { now })

      if (invoice.err) {
        return Err(invoice.err)
      }

      const invoiceId = invoice.val.invoiceId

      const collectPayment = await this.transition("COLLECT_PAYMENT", {
        invoiceId: invoiceId,
        autoFinalize: false,
        now,
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }
    } else if (currentState === "pending_invoice") {
      // continue from invoice
      const invoice = await this.transition("INVOICE", { now })

      if (invoice.err) {
        return Err(invoice.err)
      }

      const invoiceId = invoice.val.invoiceId

      const collectPayment = await this.transition("COLLECT_PAYMENT", {
        invoiceId: invoiceId,
        autoFinalize: false,
        now,
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }
    } else if (currentState === "past_due") {
      // get the pending invoice for the current phase
      const pendingInvoice = await this.getPendingPhaseInvoice({
        phaseId: this.getActivePhase().id,
        startAt: this.subscription.currentCycleStartAt,
        endAt: this.subscription.currentCycleEndAt,
      })

      if (!pendingInvoice?.id) {
        return Err(new UnPriceSubscriptionError({ message: "No pending invoice found" }))
      }

      const invoiceId = pendingInvoice.id

      const collectPayment = await this.transition("COLLECT_PAYMENT", {
        invoiceId: invoiceId,
        autoFinalize: false,
        now,
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }
    }

    await this.renewSubscription({ now })

    return Ok({
      status: "active",
    })
  }

  public async invoice(payload: { now: number }): Promise<
    Result<{ invoiceId: string }, UnPriceSubscriptionError>
  > {
    // set the subscription to active
    const { now } = payload

    const invoice = await this.transition("INVOICE", { now })

    if (invoice.err) {
      return Err(invoice.err)
    }

    return Ok({
      invoiceId: invoice.val.invoiceId,
    })
  }

  public async billing(payload: { invoiceId: string; now: number }): Promise<
    Result<
      { paymentStatus: string; retries: number; status: SubscriptionStatus },
      UnPriceSubscriptionError
    >
  > {
    // set the subscription to active
    const { invoiceId, now } = payload
    const activePhase = this.getActivePhase()

    const billing = await this.transition("COLLECT_PAYMENT", {
      invoiceId,
      autoFinalize: true,
      now,
    })

    if (billing.err) {
      return Err(billing.err)
    }

    // if the subscription is set to auto renew then we need to renew it, only if the payment is successful
    if (activePhase.autoRenew) {
      // renew the subscription will check if the payment is successful and if so will set the subscription to active
      const renew = await this.renewSubscription({ now })

      if (renew.err) {
        return Err(renew.err)
      }

      return Ok({
        paymentStatus: billing.val.paymentStatus,
        retries: billing.val.retries,
        status: renew.val.status,
      })
    }

    return Ok({
      paymentStatus: billing.val.paymentStatus,
      retries: billing.val.retries,
      status: billing.val.status,
    })
  }

  public async cancel(payload: { cancelAt?: number; now: number }): Promise<
    Result<{ status: SubscriptionStatus }, UnPriceSubscriptionError>
  > {
    const { cancelAt, now } = payload

    const cancel = await this.transition("CANCEL", { cancelAt, now })

    if (cancel.err) {
      return Err(cancel.err)
    }

    return Ok({
      status: cancel.val.status,
    })
  }
}
