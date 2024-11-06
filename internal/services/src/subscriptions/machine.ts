import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import { customerCredits, invoices, subscriptionPhases, subscriptions } from "@unprice/db/schema"
import { type FeatureType, newId } from "@unprice/db/utils"
import {
  type CalculatedPrice,
  type Customer,
  type InvoiceStatus,
  type InvoiceType,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionMetadata,
  type SubscriptionPhase,
  type SubscriptionPhaseExtended,
  type SubscriptionPhaseMetadata,
  type SubscriptionStatus,
  type WhenToBill,
  calculatePricePerFeature,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { addDays } from "date-fns"
import { StateMachine } from "../machine/service"
import { PaymentProviderService } from "../payment-provider"
import type { PaymentProviderInvoice } from "../payment-provider/interface"
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
  EXPIRE: {
    payload: { now: number; expiresAt?: number }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  CHANGE: {
    payload: {
      now: number
      changeAt?: number
    }
    result: { status: S }
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
}

// The main idea with this class is try to create transitions and states that handle the complexity of the life cycle of a subscription
// One thing to keep in mind that is very important is every transition has to be idempotent. Which means can be executed multiple times without affecting the tables.
// This is important for the retry mechanism to work as expected. Specially because most of the time we call this machine from background jobs.
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
     * validate dates and change status to pending_invoice which is the state where the subscription is waiting for invoice
     */
    this.addTransition({
      from: ["trialing"],
      to: ["active", "past_due"],
      event: "END_TRIAL",
      onTransition: async (payload) => {
        // get the active phase - subscription only has one phase active at a time
        const activePhase = this.getActivePhase()
        const subscription = this.getSubscription()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // only active phases please
        if (!activePhase.active) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is not active" }))
        }

        // check if the trial has ended if not don't do anything
        if (activePhase.trialEndsAt && activePhase.trialEndsAt > payload.now) {
          return Ok({
            subscriptionId: subscription.id,
            phaseId: activePhase.id,
            status: subscription.status,
          })
        }

        // validate the payment method
        const validatePaymentMethod = await this.validateCustomerPaymentMethod()

        if (validatePaymentMethod.err) {
          return Err(validatePaymentMethod.err)
        }

        // renew the subscription
        const renewSubscriptionResult = await this.renewSubscription()

        if (renewSubscriptionResult.err) {
          return Err(renewSubscriptionResult.err)
        }

        // for phases that are billed in arrear,we don't do anything more
        if (activePhase.whenToBill === "pay_in_arrear") {
          // if the subscription is renewed, we set the state to active
          return await this.syncState({
            state: "active",
            phaseId: activePhase.id,
            active: true,
          })
        }

        // for subscription that are billed in advance, we need to invoice the customer, and wait for the payment and renew
        // create an invoice for the subscription phase
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        // collect the payment
        const payment = await this.collectInvoicePayment({
          invoice: invoice.val.invoice,
          now: payload.now,
          autoFinalize: true,
        })

        if (payment.err) {
          return Err(payment.err)
        }

        return Ok({
          invoiceId: invoice.val.invoice.id,
          status: payment.val.status,
        })
      },
    })

    /*
     * INVOICE
     * create an invoice for the subscription phase
     * if the invoice is created successfully, the subscription phase will be set to past_due
     */
    this.addTransition({
      from: ["active"],
      to: ["past_due", "active"],
      event: "INVOICE",
      onTransition: async (payload) => {
        // get the active phase - subscription only has one phase active at a time
        const activePhase = this.getActivePhase()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // only active phases please
        if (!activePhase.active) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is not active" }))
        }

        // create an invoice for the subscription phase
        // invoice can be created any time in the cycle, but only will be due at the end or start of the cycle
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        const result = await this.finalizeInvoice({
          invoice: invoice.val.invoice,
          now: payload.now,
        })

        if (result.err) {
          return Err(result.err)
        }

        return Ok({
          invoiceId: invoice.val.invoice.id,
          status: subscription.status,
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
        const subscription = this.getSubscription()
        let invoice = await this.getInvoice(payload.invoiceId)

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        const result = await this.collectInvoicePayment({
          invoice,
          now: payload.now,
        })

        if (result.err) {
          return Err(result.err)
        }

        // wait for the payment
        return Ok({
          status: subscription.status,
          paymentStatus: result.val.status,
          retries: result.val.retries,
          invoiceId: invoice.id,
        })
      },
    })

    /*
     * RENEW TODO: continue from here
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
        const subscription = this.getSubscription()
        const currentState = this.getCurrentState()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // check if the subscription is not scheduled to be changed, expired or canceled
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is changing, cannot renew" }))
        }

        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is canceling, cannot renew" }))
        }

        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Phase is expiring, cannot renew" }))
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
        const subscription = this.getSubscription()
        const activePhase = this.getActivePhase()
        // if no cancel at is provided, we cancel at the end of the current cycle
        const cancelAt = payload.cancelAt ?? subscription.currentCycleEndAt

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

        // if the subscription is already canceling don't do anything
        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Ok({
            status: subscription.status,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // we set the cancel at in the subscription and the next invoice at the cancel at date
        // so we can process the invoice and the phase cancellation
        await this.syncState({
          phaseId: activePhase.id,
          subscriptionDates: {
            cancelAt,
            // the next invoice is the cancel at date
            nextInvoiceAt: cancelAt,
            currentCycleEndAt: cancelAt,
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

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: cancelAt, // end date of the phase is the date
          now: payload.now,
          isCancel: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is an invoice we need to update the subscription state
        if (endPhaseResult.val.invoiceId) {
          const isPaid =
            endPhaseResult.val.invoiceStatus === "paid" ||
            endPhaseResult.val.invoiceStatus === "void"
          const note = isPaid
            ? "Payment received, phase is canceled"
            : "Waiting for payment, phase is canceled"
          const reason = isPaid ? "payment_received" : "payment_pending"

          // we cancel the subscription right away and the user will be notified for the unpaid invoice
          // if any. Normally this will be done manually by the admin
          await this.syncState({
            state: endPhaseResult.val.status,
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

          // return the status of the invoice
          return Ok({
            status: endPhaseResult.val.status,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })

    /*
     * CHANGE
     * Apply a change to the subscription
     * In order to change a subscription we need to cancel the current phase and create a new one
     */
    this.addTransition({
      from: ["active"],
      to: ["changed", "active"],
      event: "CHANGE",
      onTransition: async (payload) => {
        // get active phase
        const activePhase = this.getActivePhase()
        const subscription = this.getSubscription()
        const currentState = this.getCurrentState()

        const changeAt = payload.changeAt ?? subscription.currentCycleEndAt + 1

        // cannot cancel a phase if the subscription is canceling
        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({
              message: "The subscription is canceling, cannot change the phase",
            })
          )
        }

        // if cannot cancel a subscription that is expiring
        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is expiring, cannot cancel" })
          )
        }

        // if the subscription is already changing don't do anything
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          return Ok({
            status: currentState,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        await this.syncState({
          phaseId: activePhase.id,
          subscriptionDates: {
            changeAt,
            // the next invoice is the cancel at date
            nextInvoiceAt: changeAt,
            currentCycleEndAt: changeAt,
          },
          phaseDates: {
            endAt: changeAt,
          },
          metadataSubscription: {
            note: "Phase is being changed, waiting for invoice and payment",
            reason: "pending_change",
          },
          metadataPhase: {
            note: "Phase is being changed, waiting for invoice and payment",
            reason: "pending_change",
          },
        })

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: changeAt, // end date of the phase is the date
          now: payload.now,
          isChange: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is an invoice we need to update the subscription state
        if (endPhaseResult.val.invoiceId) {
          const isPaid =
            endPhaseResult.val.invoiceStatus === "paid" ||
            endPhaseResult.val.invoiceStatus === "void"
          const note = isPaid
            ? "Payment received, phase is changed"
            : "Waiting for payment, phase is changed"
          const reason = isPaid ? "payment_received" : "payment_pending"

          // we change the subscription right away and the user will be notified for the unpaid invoice
          // if any. Normally this will be done manually by the admin
          await this.syncState({
            state: endPhaseResult.val.status,
            phaseId: activePhase.id,
            active: false,
            subscriptionDates: {
              changedAt: Date.now(),
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

          // return the status of the invoice
          return Ok({
            status: endPhaseResult.val.status,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })

    /*
     * EXPIRE
     * Apply expiration to the subscription
     */
    this.addTransition({
      from: ["active"],
      to: ["expired", "active"],
      event: "EXPIRE",
      onTransition: async (payload) => {
        // get active phase
        const activePhase = this.getActivePhase()
        const subscription = this.getSubscription()
        const currentState = this.getCurrentState()

        const expiresAt = payload.expiresAt ?? subscription.currentCycleEndAt + 1

        // cannot cancel a phase if the subscription is canceling
        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({
              message: "The subscription is canceling, cannot change the phase",
            })
          )
        }

        // if cannot cancel a subscription that is expiring
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is changing, cannot expire" })
          )
        }

        // if the subscription is already changing don't do anything
        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          return Ok({
            status: currentState,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        await this.syncState({
          phaseId: activePhase.id,
          subscriptionDates: {
            expiresAt,
            // the next invoice is the cancel at date
            nextInvoiceAt: expiresAt,
            currentCycleEndAt: expiresAt,
          },
          phaseDates: {
            endAt: expiresAt,
          },
          metadataSubscription: {
            note: "Phase is being expired, waiting for invoice and payment",
            reason: "pending_expiration",
          },
          metadataPhase: {
            note: "Phase is being changed, waiting for invoice and payment",
            reason: "pending_expiration",
          },
        })

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: expiresAt, // end date of the phase is the date
          now: payload.now,
          isExpire: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is an invoice we need to update the subscription state
        if (endPhaseResult.val.invoiceId) {
          const isPaid =
            endPhaseResult.val.invoiceStatus === "paid" ||
            endPhaseResult.val.invoiceStatus === "void"
          const note = isPaid
            ? "Payment received, phase is expired"
            : "Waiting for payment, phase is expired"
          const reason = isPaid ? "payment_received" : "payment_pending"

          // we change the subscription right away and the user will be notified for the unpaid invoice
          // if any. Normally this will be done manually by the admin
          await this.syncState({
            state: endPhaseResult.val.status,
            phaseId: activePhase.id,
            active: false,
            subscriptionDates: {
              changedAt: Date.now(),
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

          // return the status of the invoice
          return Ok({
            status: endPhaseResult.val.status,
            phaseId: activePhase.id,
            subscriptionId: this.subscription.id,
          })
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })
  }

  /**
   * IMPORTANT: this allow us to keep in sync phase and subscription data when transactions are being executed
   * Updates the active subscription phase by copying all properties from the provided phase
   * into the current activePhase property. This allows updating the phase data without
   * breaking the reference to the original activePhase object.
   *
   * Note: Properties that exist in activePhase but not in the provided phase will be preserved.
   * Object.assign() only overwrites properties that exist in the source object.
   *
   * @param phase - The new subscription phase data to merge into the active phase
   */
  private setActivePhase(phase: SubscriptionPhase): void {
    Object.assign(this.activePhase, phase)
  }

  /**
   * IMPORTANT: this allow us to keep in sync phase and subscription data when transactions are being executed
   * Updates the subscription by copying all properties from the provided subscription
   * into the current subscription property. This allows updating the subscription data without
   * breaking the reference to the original subscription object.
   *
   * @param subscription - The new subscription data to merge into the current subscription
   */
  private setSubscription(subscription: Subscription): void {
    Object.assign(this.subscription, subscription)
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
    subscriptionDates?: Partial<{
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
  }): Promise<Result<{
    subscriptionId: string
    phaseId: string
    status: SubscriptionStatus
  }, UnPriceSubscriptionError>> {
    const activePhase = this.getActivePhase()
    const subscription = this.getSubscription()

    if (!activePhase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    try {
      return await this.db.transaction(async (tx) => {
        // update the subscription status
        const subscriptionUpdated = await tx
          .update(subscriptions)
          .set({
            status: state ?? subscription.status,
            active: active ?? subscription.active,
            // update the subscription dates
            ...(subscriptionDates ? subscriptionDates : undefined),
            ...(metadataSubscription ? {
                metadata: metadataSubscription,
              }
            : undefined),
          })
          .where(eq(subscriptions.id, subscription.id))
          .returning()
          .then((res) => res[0])
          .catch((e) => {
            console.error("Error updating subscription status:", e)
            tx.rollback()
          })

        // update the subscription phase status
        const phaseUpdated = await tx
          .update(subscriptionPhases)
          .set({
            status: state ?? activePhase.status,
            active: active ?? activePhase.active,
            ...(phaseDates ? phaseDates : undefined),
            ...(metadataPhase ? {
                metadata: metadataPhase,
              }
            : undefined),
          })
          .where(
            and(
              eq(subscriptionPhases.subscriptionId, this.subscription.id),
              eq(subscriptionPhases.id, activePhase.id)
            )
          )
          .returning()
          .then((res) => res[0])
          .catch((e) => {
            console.error("Error updating subscription phase status:", e)
            tx.rollback()
          })

        // sync the active phase and subscription with the new values
        phaseUpdated && this.setActivePhase(phaseUpdated)
        subscriptionUpdated && this.setSubscription(subscriptionUpdated)

        return Ok({
          subscriptionId: subscription.id,
          phaseId: activePhase.id,
          status: state ?? subscription.status,
        })
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

  private getSubscription(): Subscription {
    return this.subscription
  }

  private async getInvoice(invoiceId: string): Promise<SubscriptionInvoice | undefined> {
    const invoice = await this.db.query.invoices.findFirst({
      where: (table, { eq }) => eq(table.id, invoiceId),
    })

    return invoice
  }

  private async getPhaseInvoiceByStatus({
    phaseId,
    startAt,
    status,
  }: {
    phaseId: string
    startAt: number
    status: "paid" | "open"
  }): Promise<SubscriptionInvoice | undefined> {
    const pendingInvoice = await this.db.query.invoices.findFirst({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionPhaseId, phaseId),
          // we purposelly use the startAt from the subscription to get the invoice
          // because the end can change so we want to get the invoice for the current cycle
          eq(table.cycleStartAt, startAt),
          status === "open"
            ? inArray(table.status, ["draft", "unpaid"])
            : inArray(table.status, ["paid", "void"])
        ),
    })

    return pendingInvoice
  }

  private async renewSubscription(): Promise<Result<void, UnPriceSubscriptionError>> {
    const subscription = this.getSubscription()
    const activePhase = this.getActivePhase()
    const autoRenew = activePhase.autoRenew

    if (!autoRenew) {
      return Err(new UnPriceSubscriptionError({ message: "Subscription is not auto renewing" }))
    }

    // calculate next billing cycle - if there is an end date the cylce will go from the start of the cycle to the end date
    const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
      currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
      billingCycleStart: activePhase.startCycle, // start day of the billing cycle
      billingPeriod: activePhase.planVersion?.billingPeriod ?? "month", // billing period
      endAt: activePhase.endAt ?? undefined, // end day of the billing cycle if any
    })

    // Check if cycle end is after any scheduled change, cancel or expiry dates
    if (subscription.changeAt || subscription.cancelAt || subscription.expiresAt) {
      const changeDate = subscription.changeAt ? new Date(subscription.changeAt) : null;
      const cancelDate = subscription.cancelAt ? new Date(subscription.cancelAt) : null;
      const expiryDate = subscription.expiresAt ? new Date(subscription.expiresAt) : null;

      // Check if cycle end is after any of the scheduled dates that exist
      if ((changeDate && cycleEnd > changeDate) ||
          (cancelDate && cycleEnd > cancelDate) ||
          (expiryDate && cycleEnd > expiryDate)) {
        return Err(new UnPriceSubscriptionError({ message: "Subscription cannot be renewed, it's scheduled to end in the future and the cycle end is after the scheduled date" }))
      }
    }

    const whenToBill = activePhase.whenToBill

    // renewing a phase implies setting the new cycle for the subscription
    const syncStateResult = await this.syncState({
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

    if (syncStateResult.err) {
      return Err(syncStateResult.err)
    }

    return Ok(undefined)
  }

  // And a subscription and end date could be expiration date changed date and canceled date
  // This will apply the changes that are scheduled or it will apply the changes immediately if the above mentioned dates are in the past.
  private async endSubscriptionActivePhase(payload: {
    endAt: number
    now: number
    isCancel?: boolean
    isChange?: boolean
    isExpire?: boolean
    isTrial?: boolean
  }): Promise<
    Result<
      {
        status: SubscriptionStatus
        phaseId: string
        subscriptionId: string
        invoiceId?: string
        invoiceStatus?: InvoiceStatus
      },
      UnPriceSubscriptionError
    >
  > {
    const {
      endAt,
      now,
      isCancel = false,
      isChange = false,
      isExpire = false,
      // TODO: ending a trial is not implemented yet
      isTrial = false,
    } = payload
    // get active phase
    const activePhase = this.getActivePhase()
    const subscription = this.getSubscription()
    const currentState = this.getCurrentState()

    let finalState: SubscriptionStatus

    if (isCancel) {
      finalState = "canceled"
    } else if (isChange) {
      finalState = "changed"
    } else if (isExpire) {
      finalState = "expired"
    } else {
      finalState = "canceled"
    }

    // if the end at is now we applied changes immediately
    if (endAt <= now) {
      // here we have to verify if there is an open invoice for the phase or the invoice is already paid
      const paidInvoice = await this.getPhaseInvoiceByStatus({
        phaseId: activePhase.id,
        startAt: subscription.currentCycleStartAt,
        status: "paid",
      })

      // if the invoice is already paid, and it's paid in advance, we need to prorate the invoice
      if (paidInvoice && paidInvoice.whenToBill === "pay_in_advance") {
        // we need to prorate the flat charges for the current cycle, which means we calculate
        // how much the customer has already paid for the cycle and we create a credit for the difference
        // we don't worry about usage charges because those are calculated in the invoice part
        const proratedInvoice = await this.prorateInvoice({
          invoiceId: paidInvoice.id,
          now: payload.now,
          startAt: paidInvoice.cycleStartAt,
          endAt: endAt, // this is the date the phase is canceled
        })

        if (proratedInvoice.err) {
          return Err(proratedInvoice.err)
        }
      }

      // create an invoice for the canceled phase. If there is an open invoice, we don't create a new one
      // but we will use the existing one to apply discount and charge usage if any
      // the invoice behaviour will change depending on the reason of the end
      const invoiceResult = await this.createInvoiceSubscriptionActivePhase({
        now: payload.now,
        isCancel,
        isEndTrial: false,
      })

      if (invoiceResult.err) {
        return Err(invoiceResult.err)
      }

      const invoice = invoiceResult.val.invoice

      // collect the payment
      const payment = await this.collectInvoicePayment({
        invoice: invoice,
        now: payload.now,
        autoFinalize: true,
      })

      if (payment.err) {
        return Err(payment.err)
      }

      // TODO: actually here I should implement due behaviour

      return Ok({
        status: finalState,
        phaseId: activePhase.id,
        subscriptionId: this.subscription.id,
        invoiceId: invoice.id,
        invoiceStatus: invoice.status,
      })
    }

    return Ok({
      status: currentState,
      phaseId: activePhase.id,
      subscriptionId: this.subscription.id,
    })
  }

  // check if the subscription requires a payment method and if the customer has one
  private async validateCustomerPaymentMethod(): Promise<
    Result<
      {
        paymentMethodId: string
        requiredPaymentMethod: boolean
      },
      UnPriceSubscriptionError
    >
  > {
    const phase = this.getActivePhase()
    const customer = this.customer
    const planVersion = phase.planVersion
    const requiredPaymentMethod = planVersion.paymentMethodRequired

    // if the plan version does not require a payment method, we don't need to validate
    if (!requiredPaymentMethod) {
      return Ok({
        paymentMethodId: "",
        requiredPaymentMethod: false,
      })
    }

    const paymentProviderService = new PaymentProviderService({
      customer: customer,
      paymentProviderId: planVersion.paymentProvider,
      logger: this.logger,
    })

    const { err, val: paymentMethodId } = await paymentProviderService.getDefaultPaymentMethodId()

    if (err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting default payment method: ${err.message}`,
        })
      )
    }

    if (requiredPaymentMethod && !paymentMethodId.paymentMethodId) {
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

    return Ok({
      paymentMethodId: paymentMethodId.paymentMethodId,
      requiredPaymentMethod,
    })
  }

  // when trying to create an invoice this method is either idempotent which means if it's executed multiple times
  // it will update and just effect one invoice or it can create a new invoice
  // The main idea here is just create a invoice that later on will be closed and finalized by other stages in the machine.
  // There are special cases for instance when the invoice is created in a cancel stage or when the invoice is created in a trial stage
  // This means we need to create an invoice with those exact cycles
  private async createInvoiceSubscriptionActivePhase(payload: {
    now: number
    isCancel?: boolean
    isEndTrial?: boolean
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { now, isCancel = false, isEndTrial = false } = payload

    const subscription = this.getSubscription()
    const phase = this.getActivePhase()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    // state of the subscription can change and this gave us the current state of the machine
    const currentState = this.getCurrentState()

    // check if the phase is active and invoicing status
    if (!phase.active || !["pending_invoice", "active"].includes(currentState)) {
      return Err(new UnPriceSubscriptionError({ message: "Phase is not active or not invoicing" }))
    }

    // if the subscription is not ready to be invoiced we send an err
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Subscription is not ready to be invoiced" }))
    }

    // get the pening invoice for the given date
    const pendingInvoice = await this.getPhaseInvoiceByStatus({
      phaseId: phase.id,
      startAt: subscription.currentCycleStartAt,
      status: "open",
    })

    let invoiceId = newId("invoice")

    if (pendingInvoice?.id) {
      invoiceId = pendingInvoice.id as `inv_${string}`
    }

    // validate if the customer has a payment method and if the plan version requires it
    const paymentValidation = await this.validateCustomerPaymentMethod()

    if (paymentValidation.err) {
      return Err(paymentValidation.err)
    }

    // pay_in_advance =  invoice flat charges for the current cycle + usage from the previous cycle if any
    // pay_in_arrear = invoice usage + flat charges for the current cycle
    // isCancel = true means the phase is being canceled, we need to invoice the current cycle differently
    // - pay_in_advance = the invoice was already paid or created, we need to calculate pro ratio for flat charges if any
    // + the usage charges from the current cycle
    // - pay_in_arrear = the invoice was not paid, we need to calculate the usage for the current cycle and add the flat charges pro rata

    // invoice type is always hybrid except if the phase is being canceled and the whenToBill is pay_in_advance
    // but if thre is an invoice pending (which means not paid yet) that mean the invoice Type is hybrid.
    const whenToBill = phase.whenToBill
    // invoice type is super important because based on it we know how to calculate the invoice total
    let invoiceType = isCancel && whenToBill === "pay_in_advance" ? "usage" : "hybrid"

    if (pendingInvoice) {
      invoiceType = "hybrid"
    }

    // don't charge usage records that were created in the trial period
    if (isEndTrial && whenToBill === "pay_in_advance") {
      invoiceType = "flat"
    }

    const planVersion = phase.planVersion
    const { requiredPaymentMethod } = paymentValidation.val
    const collectionMethod = phase.collectionMethod

    // calculate when to bill - if the subscription is pay in advance, the due date is the start of the cycle
    // if the subscription is pay in arrear, the due date is the end of the cycle
    let dueAt =
      whenToBill === "pay_in_advance"
        ? subscription.currentCycleStartAt
        : subscription.currentCycleEndAt

    // if is cancel due date is always in the end of the cycle
    if (isCancel) {
      dueAt = subscription.currentCycleEndAt
    }

    // calculate the grace period based on the due date
    // this is when the invoice will be considered past due after that if not paid we can end it, cancel it, etc.
    const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()

    // create the invoice, if there is a pending invoice we will use it, otherwise we will create a new one
    const invoice = await this.db
      .insert(invoices)
      .values({
        id: invoiceId,
        subscriptionId: subscription.id,
        subscriptionPhaseId: phase.id,
        cycleStartAt: subscription.currentCycleStartAt,
        cycleEndAt: subscription.currentCycleEndAt,
        status: "draft",
        type: invoiceType as InvoiceType,
        // this allows us to know when to bill the invoice, when to get usage from past cycles
        whenToBill,
        dueAt,
        pastDueAt,
        total: 0, // this will be updated when the invoice is finalized
        subtotal: 0, // this will be updated when the invoice is finalized
        amountCreditUsed: 0, // this will be updated when the invoice is finalized
        invoiceUrl: "", // this will be updated when the invoice is finalized
        invoiceId: "", // this will be updated when the invoice is finalized
        paymentProvider: planVersion.paymentProvider,
        requiredPaymentMethod: requiredPaymentMethod,
        projectId: subscription.projectId,
        collectionMethod,
        currency: planVersion.currency,
        previousCycleStartAt: subscription.previousCycleStartAt,
        previousCycleEndAt: subscription.previousCycleEndAt,
        metadata: {
          note: `Invoice for the ${subscription.planSlug} subscription`,
        },
      })
      .onConflictDoUpdate({
        target: [invoices.id, invoices.projectId],
        // if the invoice is pending, we update the cycle dates
        set: {
          type: invoiceType as InvoiceType,
          cycleStartAt: subscription.currentCycleStartAt,
          cycleEndAt: subscription.currentCycleEndAt,
          previousCycleStartAt: subscription.previousCycleStartAt,
          previousCycleEndAt: subscription.previousCycleEndAt,
          dueAt,
          pastDueAt,
        },
      })
      .returning()
      .then((res) => res[0])
      .catch((e) => {
        this.logger.error("Error creating invoice:", e)
        return undefined
      })

    if (!invoice) {
      return Err(new UnPriceSubscriptionError({ message: `Error creating invoice ${invoiceId}` }))
    }

    // update subscription dates
    await this.syncState({
      phaseId: phase.id,
      subscriptionDates: {
        pastDueAt,
        lastInvoiceAt: payload.now,
      }
    })

    return Ok({
      invoice,
    })
  }

  // given an invoice that is already paid, we need to prorate the flat charges
  // this is normally done when a phase is canceled and the when to invoice is pay in advance
  private async prorateInvoice({
    invoiceId,
    startAt,
    endAt,
  }: {
    invoiceId: string
    now: number
    startAt: number
    endAt: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    // get the invoice
    const invoice = await this.getInvoice(invoiceId)

    if (!invoice) {
      return Err(new UnPriceSubscriptionError({ message: `Invoice ${invoiceId} not found` }))
    }

    if (!["paid", "void"].includes(invoice.status)) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not paid, only paid invoices can be prorated`,
        })
      )
    }

    // has to be paid in advance
    if (invoice.whenToBill !== "pay_in_advance") {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not a pay in advance invoice`,
        })
      )
    }

    // the start date should be the same as the subscription cycle start date
    if (startAt !== invoice.cycleStartAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Start date ${startAt} is not the same as the invoice cycle start date ${invoice.cycleStartAt}`,
        })
      )
    }

    // end date should be between the subscription cycle start and end date
    if (endAt < invoice.cycleStartAt || endAt > invoice.cycleEndAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: `End date ${endAt} is not between the invoice cycle start date ${invoice.cycleStartAt} and end date ${invoice.cycleEndAt}`,
        })
      )
    }

    // calculate the prorated flat charges given these dates
    const invoiceProratedFlatItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
      cycleStartAt: startAt,
      cycleEndAt: endAt, // IMPORTANT: this is the end of the prorated period
      previousCycleStartAt: invoice.previousCycleStartAt,
      previousCycleEndAt: invoice.previousCycleEndAt,
      whenToBill: invoice.whenToBill,
      type: "flat", // we are prorating flat charges only
    })

    // get the invoice already paid from the payment provider
    const paymentProviderService = new PaymentProviderService({
      paymentProviderId: invoice.paymentProvider,
      customer: this.customer,
      logger: this.logger,
    })

    if (!invoice.invoiceId) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice has no invoice id" }))
    }

    // check if the invoice is already paid in the payment provider
    if (invoice.status !== "paid" && invoice.status !== "void") {
      return Err(
        new UnPriceSubscriptionError({
          message: `Invoice ${invoiceId} is not paid, cannot prorate`,
        })
      )
    }

    const paymentProviderInvoice = await paymentProviderService.getInvoice({
      invoiceId: invoice.invoiceId,
    })

    if (paymentProviderInvoice.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting payment provider invoice: ${paymentProviderInvoice.err.message}`,
        })
      )
    }

    let amountRefund = 0

    // calculate the prorated flat charges
    // There must be a parity between flat items and item invoices.
    // This means that if we have an item in the prorated flat items price
    // we should have the same item in the payment provider invoice
    for (const item of paymentProviderInvoice.val?.items ?? []) {
      const { id, amount: amountPaid, productId, currency, metadata } = item

      // find the item in the invoice prorated flat items price
      const invoiceFlatItem = invoiceProratedFlatItemsPrice.val?.items.find(
        (i) =>
          i.productId === productId ||
          i.metadata?.subscriptionItemId === metadata?.subscriptionItemId
      )

      if (!invoiceFlatItem) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} not found in the prorated flat items price`,
          })
        )
      }

      // double check we are not prorating items that are not flat
      if (!["flat", "tier", "package"].includes(invoiceFlatItem.type)) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} is not a flat charge, cannot prorate`,
          })
        )
      }

      // should be the same currency as the invoice
      if (invoice.currency !== currency.toUpperCase()) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Invoice item ${id} has different currency as the invoice ${invoice.currency}`,
          })
        )
      }

      // depending on the payment provider, the amount is in different unit
      // TODO: is unit amount or total amount?
      const formattedAmount = paymentProviderService.formatAmount(
        invoiceFlatItem.price.totalPrice.dinero
      )

      if (formattedAmount.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error formatting amount" }))
      }

      // all of this to calculate how much to refund to the customer
      amountRefund += amountPaid - formattedAmount.val.amount
    }

    if (amountRefund > 0) {
      // create a credit for the customer
      const credit = await this.db
        .insert(customerCredits)
        .values({
          id: newId("customer_credit"),
          totalAmount: amountRefund,
          amountUsed: 0,
          customerId: this.customer.id,
          projectId: invoice.projectId,
          active: true,
          metadata: {
            note: `Refund for the prorated flat charges from ${startAt} to ${endAt}`,
          },
        })
        .returning()

      if (!credit) {
        return Err(new UnPriceSubscriptionError({ message: "Error creating credit" }))
      }
    }

    return Ok(undefined)
  }

  // TODO: add preview invoice so when we create the invoice we are sure it works
  // Finalizing an invoice only happens when the customer is ready to be invoiced and
  // this means we are going to create an invoice in the payment provider and right away
  // we're going to try to collect the payment
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
      projectId,
      invoiceId,
    } = invoice

    // pay_in_advance =  invoice flat charges for the current cycle + usage from the previous cycle if any
    // pay_in_arrear = invoice usage + flat charges for the current cycle
    // isCancel = true means the phase is being canceled, we need to invoice the current cycle differently
    // - pay_in_advance = the invoice was already paid or created, we need to calculate pro ratio for flat charges if any
    // + the usage charges from the current cycle
    // - pay_in_arrear = the invoice was not paid, we need to calculate the usage for the current cycle and add the flat charges pro rata

    const paymentProviderInvoiceData = {
      invoiceId: "",
      invoiceUrl: "",
      total: 0,
      subtotal: 0,
      amountCreditUsed: 0,
      customerCreditId: "",
      status: "unpaid" as InvoiceStatus,
    }

    const paymentProviderService = new PaymentProviderService({
      paymentProviderId: paymentProvider,
      customer: this.customer,
      logger: this.logger,
    })

    const paymentValidation = await this.validateCustomerPaymentMethod()

    if (paymentValidation.err) {
      return Err(paymentValidation.err)
    }

    let invoiceData: PaymentProviderInvoice

    // if there is an invoice id, we get the invoice from the payment provider
    if (invoiceId) {
      const invoiceDataResult = await paymentProviderService.getInvoice({ invoiceId })

      if (invoiceDataResult.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error getting invoice" }))
      }

      // this should not happen, but just in case
      if (invoiceDataResult.val.status === "paid" || invoiceDataResult.val.status === "void") {
        return Err(
          new UnPriceSubscriptionError({
            message: "Invoice is already paid or void, cannot finalize",
          })
        )
      }

      // update the invoice with the new cycle dates
      // could be possible the invoice is open and the customer cancel the phase, then we need to update the cycle dates
      const updatedInvoice = await paymentProviderService.updateInvoice({
        invoiceId: invoiceDataResult.val.invoiceId,
        startCycle: cycleStartAt,
        endCycle: cycleEndAt,
        collectionMethod,
        description: metadata?.note ?? "",
        dueDate: invoice.pastDueAt,
      })

      if (updatedInvoice.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
      }

      invoiceData = updatedInvoice.val
    } else {
      // create a new invoice//
      const paymentProviderInvoice = await paymentProviderService.createInvoice({
        currency,
        customerName: this.customer.name,
        email: this.customer.email,
        startCycle: cycleStartAt,
        endCycle: cycleEndAt,
        collectionMethod,
        description: metadata?.note ?? "",
        dueDate: invoice.pastDueAt,
      })

      if (paymentProviderInvoice.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error creating ${paymentProvider} invoice: ${paymentProviderInvoice.err.message}`,
          })
        )
      }

      invoiceData = paymentProviderInvoice.val
    }

    // save the invoice id and url just in case the rest of the process fails
    // and we need to retry
    await this.db
      .update(invoices)
      .set({
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
      })
      .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))

    // calculate the price of the invoice items
    const invoiceItemsPrice = await this.calculateSubscriptionActivePhaseItemsPrice({
      cycleStartAt,
      cycleEndAt,
      previousCycleStartAt: invoice.previousCycleStartAt,
      previousCycleEndAt: invoice.previousCycleEndAt,
      whenToBill: invoice.whenToBill,
      type: invoice.type, // this is important because determines which items are being billed (flat, usage, or all - hybrid)
      // and only returns those items
    })

    if (invoiceItemsPrice.err) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error calculating invoice items price: ${invoiceItemsPrice.err.message}`,
        })
      )
    }

    // upsert the invoice items in the payment provider
    for (const item of invoiceItemsPrice.val.items) {
      // depending on the payment provider, the amount is in different unit
      // TODO: is unit amount or total amount?
      const formattedAmount = paymentProviderService.formatAmount(item.price.unitPrice.dinero)

      if (formattedAmount.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error formatting amount: ${formattedAmount.err.message}`,
          })
        )
      }

      // get the total amount of the invoice
      paymentProviderInvoiceData.subtotal += formattedAmount.val.amount

      // update the invoice with the items price
      // if it does, we need to update the amount
      // if not, we need to create the invoice item
      const invoiceItemExists = invoiceData.items.find(
        (i) =>
          i.productId === item.productId ||
          i.metadata?.subscriptionItemId === item.metadata?.subscriptionItemId
      )

      if (invoiceItemExists) {
        // update the amount or quantity if it exists
        // TODO: is unit amount or total amount?
        const updateItemInvoice = await paymentProviderService.updateInvoiceItem({
          invoiceItemId: invoiceItemExists.id,
          amount: formattedAmount.val.amount,
          quantity: item.quantity,
          name: item.productSlug,
          isProrated: item.prorate !== 1,
          metadata: item.metadata,
        })

        if (updateItemInvoice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error updating invoice item: ${updateItemInvoice.err.message}`,
            })
          )
        }
      } else {
        // TODO: is unit amount or total amount?
        const itemInvoice = await paymentProviderService.addInvoiceItem({
          invoiceId: invoiceData.invoiceId,
          name: item.productSlug,
          productId: item.productId,
          isProrated: item.prorate !== 1,
          amount: formattedAmount.val.amount,
          quantity: item.quantity,
          currency: invoice.currency,
          metadata: item.metadata,
        })

        if (itemInvoice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error adding invoice item: ${itemInvoice.err.message}`,
            })
          )
        }
      }
    }

    paymentProviderInvoiceData.invoiceId = invoiceData.invoiceId
    paymentProviderInvoiceData.invoiceUrl = invoiceData.invoiceUrl

    // get the credits for the customer if any
    // for now we only allow one active credit per customer
    const credits = await this.db.query.customerCredits
      .findMany({
        where: (table, { eq, and }) =>
          and(eq(table.customerId, this.customer.id), eq(table.active, true)),
      })
      .then((res) => res[0])

    // the amount of the credit used to pay the invoice
    let amountCreditUsed = 0
    const customerCreditId = credits?.id

    // if there is a credit and the remaining amount is greater than the invoice subtotal, we discount the substotal from the credit
    // if not we apply the entire credit to the invoice
    // either case we need to update the credit with the amount used and create a negative charge for the invoice in the payment provider
    if (customerCreditId) {
      // set the customer credit id to the invoice
      paymentProviderInvoiceData.customerCreditId = customerCreditId

      const remainingCredit = credits.totalAmount - credits.amountUsed

      // set the total amount of the credit
      if (remainingCredit > paymentProviderInvoiceData.subtotal) {
        amountCreditUsed = paymentProviderInvoiceData.subtotal
      } else {
        amountCreditUsed = remainingCredit
      }

      if (amountCreditUsed > 0) {
        // we need to check if the invoice item already exists
        // if it does, we update the amount
        // if not, we create the invoice item with a negative amount
        const creditChargeExists = invoiceData.items.find(
          (i) => i.metadata?.creditId === customerCreditId
        )

        if (creditChargeExists) {
          const creditCharge = await paymentProviderService.updateInvoiceItem({
            invoiceItemId: creditChargeExists.id,
            amount: -amountCreditUsed,
            name: "Credit",
            description: "Credit applied to the invoice",
            isProrated: false,
            quantity: 1,
            metadata: {
              creditId: customerCreditId,
            },
          })

          if (creditCharge.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error updating credit charge: ${creditCharge.err.message}`,
              })
            )
          }
        } else {
          const creditCharge = await paymentProviderService.addInvoiceItem({
            invoiceId: invoiceData.invoiceId,
            name: "Credit",
            description: "Credit applied to the invoice",
            isProrated: false,
            amount: -amountCreditUsed,
            quantity: 1,
            currency: invoice.currency,
            metadata: {
              creditId: customerCreditId,
            },
          })

          if (creditCharge.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error adding credit charge: ${creditCharge.err.message}`,
              })
            )
          }
        }
      }
    }

    // total amount of the invoice after the credit is applied
    paymentProviderInvoiceData.total = paymentProviderInvoiceData.subtotal - amountCreditUsed

    // if total is 0, we need to set the invoice status to void
    if (paymentProviderInvoiceData.total === 0) {
      paymentProviderInvoiceData.status = "void"
      // TODO: we need to void the invoice in the payment provider
    }

    // update credit and invoice in a transaction
    const result = await this.db.transaction(async (tx) => {
      try {
        if (customerCreditId) {
          const amountUsed = credits.amountUsed + amountCreditUsed

          // if the whole credit is used, we need to set the credit to inactive
          const status = !(amountUsed >= credits.totalAmount)
          await tx
            .update(customerCredits)
            .set({
              amountUsed,
              active: status,
            })
            .where(
              and(
                eq(customerCredits.id, customerCreditId),
                eq(customerCredits.projectId, projectId)
              )
            )
            .catch((e) => {
              tx.rollback()
              throw e
            })
        }

        // if all goes well, update the invoice with the payment provider invoice data
        // and set the status to unpaid so we can collect the payment
        const updatedInvoice = await tx
          .update(invoices)
          .set({
            invoiceId: paymentProviderInvoiceData.invoiceId,
            invoiceUrl: paymentProviderInvoiceData.invoiceUrl,
            subtotal: paymentProviderInvoiceData.subtotal,
            total: paymentProviderInvoiceData.total,
            status: paymentProviderInvoiceData.status,
            amountCreditUsed,
            // set the customer credit id if it exists
            ...(paymentProviderInvoiceData.customerCreditId !== "" && {
              customerCreditId: paymentProviderInvoiceData.customerCreditId,
            }),
          })
          .where(and(eq(invoices.id, invoice.id), eq(invoices.projectId, projectId)))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error finalizing invoice" }))
        }

        // update the state
        await this.syncState({
          phaseId: invoice.subscriptionPhaseId,
          state: "past_due",
            subscriptionDates: {
              pastDueAt: updatedInvoice.pastDueAt,
              lastInvoiceAt: payload.now,
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

        return Ok({ invoice: updatedInvoice })
      } catch (e) {
        const error = e as Error
        return Err(
          new UnPriceSubscriptionError({ message: `Error finalizing invoice: ${error.message}` })
        )
      }
    })



    return result
  }

  private async collectInvoicePayment(payload: {
    invoice: SubscriptionInvoice
    autoFinalize?: boolean
    now: number
  }): Promise<
    Result<
      { status: InvoiceStatus; retries: number; pastDueAt: number | undefined },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now, autoFinalize = false } = payload

    let invoiceData = invoice

    if (autoFinalize) {
      const result = await this.finalizeInvoice({
        invoice,
        now,
      })

      if (result.err) {
        return Err(result.err)
      }

      invoiceData = result.val.invoice
    }

    let result: InvoiceStatus = "waiting"

    // TODO: how to handle multiple invoices?
    const { collectionMethod, paymentProvider, invoiceId, status, paymentAttempts, pastDueAt, dueAt } =
    invoiceData

    const paymentProviderService = new PaymentProviderService({
      paymentProviderId: paymentProvider,
      customer: this.customer,
      logger: this.logger,
    })

    // check if the invoice is due
    if (dueAt && dueAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice is not due yet" }))
    }

    // check if the invoice is already paid
    if (["paid", "void"].includes(status)) {
      return Ok({ status: status, retries: paymentAttempts?.length ?? 0, pastDueAt })
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

    // TODO: does it makes sense to collect payment from invoices with total 0?

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
            invoiceUrl: statusInvoice.val.invoiceUrl,
            paymentAttempts: [...(paymentAttempts ?? []), ...statusInvoice.val.paymentAttempts],
          })
          .where(eq(invoices.id, invoice.id))
          .returning()
          .then((res) => res[0])

        if (!updatedInvoice) {
          return Err(new UnPriceSubscriptionError({ message: "Error updating invoice" }))
        }

        // update the subscription dates
        await this.syncState({
          phaseId: invoice.subscriptionPhaseId,
          state: "active",
          active: true,
          metadataSubscription: {},
          metadataPhase: {},
        })

        return Ok({
          status: statusInvoice.val.status,
          retries: updatedInvoice.paymentAttempts?.length ?? 0,
          pastDueAt,
        })
      }

      // update the subscription dates
      await this.syncState({
        phaseId: invoice.subscriptionPhaseId,
        state: "past_due",
        active: true,
        metadataSubscription: {
          note: "Waiting for payment",
          reason: "payment_pending",
        },
        metadataPhase: {
          note: "Waiting for payment",
          reason: "payment_pending",
        },
      })

      return Ok({ status: "waiting", retries: paymentAttempts?.length ?? 0, pastDueAt })
    }

    // 3 attempts max
    if (paymentAttempts?.length && paymentAttempts.length >= 3) {
      // update the invoice status
      await this.db
        .update(invoices)
        .set({ status: "failed", pastDueAt: Date.now() })
        .where(eq(invoices.id, invoice.id))

      // update the subscription dates
      await this.syncState({
        phaseId: invoice.subscriptionPhaseId,
        state: "past_due",
        active: true,
        metadataSubscription: {
          note: "Invoice has reached the maximum number of payment attempts",
          reason: "payment_failed",
        },
        metadataPhase: {
          note: "Invoice has reached the maximum number of payment attempts",
          reason: "payment_failed",
        },
      })

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

      // update the subscription dates
      await this.syncState({
        phaseId: invoice.subscriptionPhaseId,
        state: "active",
        active: true,
        subscriptionDates: {
          pastDueAt: undefined,
        },
        metadataSubscription: {},
        metadataPhase: {},
      })

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


      // update the subscription dates
      await this.syncState({
        phaseId: invoice.subscriptionPhaseId,
        state: "past_due",
        active: true,
        metadataSubscription: {
          note: "Invoice sent to the customer",
          reason: "payment_pending",
        },
        metadataPhase: {
          note: "Invoice sent to the customer",
          reason: "payment_pending",
        },
      })

      // this is a manual payment and we check with background job if the payment is successful
      result = "waiting"
    }

    return Ok({ status: result, retries: paymentAttempts?.length ?? 0, pastDueAt })
  }

  private async calculateSubscriptionActivePhaseItemsPrice(payload: {
    cycleStartAt: number
    cycleEndAt: number
    previousCycleStartAt: number | null
    previousCycleEndAt: number | null
    whenToBill: WhenToBill
    type: InvoiceType
  }): Promise<
    Result<
      {
        items: {
          productId: string
          price: CalculatedPrice
          quantity: number
          prorate: number
          productSlug: string
          type: FeatureType
          metadata: {
            subscriptionItemId: string
          }
        }[]
      },
      UnPriceSubscriptionError
    >
  > {
    const phase = this.getActivePhase()
    const subscription = this.getSubscription()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    const { cycleStartAt, cycleEndAt, previousCycleStartAt, previousCycleEndAt, whenToBill, type } =
      payload

    // when billing in advance we calculate flat price for the current cycle + usage from the past cycles
    // when billing in arrear we calculate usage for the current cycle + flat price current cycle
    const shouldBillInAdvance = whenToBill === "pay_in_advance"

    // calculate proration for the current billing cycle
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      currentCycleStartAt: cycleStartAt,
      billingCycleStart: phase.startCycle, // day of the month
      billingPeriod: phase.planVersion?.billingPeriod ?? "month",
      endAt: cycleEndAt,
    })

    const proration = calculatedCurrentBillingCycle.prorationFactor
    const invoiceItems = []

    const billableItems =
      type === "hybrid"
        ? phase.items
        : type === "flat"
          ? // flat charges are those when the quantity is defined in the subscription item
            phase.items.filter((item) =>
              ["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)
            )
          : phase.items.filter((item) => item.featurePlanVersion.featureType === "usage")

    // we bill the subscriptions items attached to the phase, that way if the customer changes the plan,
    // we create a new phase and bill the new plan and there are no double charges for the same feature in past cycles
    // also this give us the flexibility to add new features to the plan without affecting the past invoices
    // we called that custom entitlements (outside of the subscription)

    try {
      // create an invoice item for each feature
      for (const item of billableItems) {
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
          prorate: prorate,
          type: item.featurePlanVersion.featureType,
          metadata: {
            subscriptionItemId: item.id,
          },
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

  public async renew(payload: { now: number }): Promise<
    Result<{ status: SubscriptionStatus }, UnPriceSubscriptionError>
  > {
    const { now } = payload
    const renew = await this.transition("RENEW", { now })

    if (renew.err) {
      return Err(renew.err)
    }

    return Ok({
      status: renew.val.status,
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
      const pendingInvoice = await this.getPhaseInvoiceByStatus({
        phaseId: this.getActivePhase().id,
        startAt: this.getSubscription().currentCycleStartAt,
        status: "open",
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

    // TODO: re think this
    await this.renew({ now })

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
      const renew = await this.renew({ now })

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

  // apply a change to the subscription, the new subscription phase should be created
  public async change(payload: { changeAt?: number; now: number }): Promise<
    Result<{ status: SubscriptionStatus }, UnPriceSubscriptionError>
  > {
    const { changeAt, now } = payload

    const change = await this.transition("CHANGE", { changeAt, now })

    if (change.err) {
      return Err(change.err)
    }

    return Ok({
      status: change.val.status,
    })
  }

  // apply a change to the subscription, the new subscription phase should be created
  public async expire(payload: { expiresAt?: number; now: number }): Promise<
    Result<{ status: SubscriptionStatus }, UnPriceSubscriptionError>
  > {
    const { expiresAt, now } = payload

    const expire = await this.transition("EXPIRE", { expiresAt, now })

    if (expire.err) {
      return Err(expire.err)
    }

    return Ok({
      status: expire.val.status,
    })
  }
}
