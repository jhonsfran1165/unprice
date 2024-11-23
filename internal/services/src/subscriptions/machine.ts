import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import { customerCredits, invoices, subscriptionPhases, subscriptions } from "@unprice/db/schema"
import { type FeatureType, newId } from "@unprice/db/utils"
import {
  type CalculatedPrice,
  type Customer,
  type InvoiceStatus,
  type InvoiceType,
  type PhaseStatus,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionMetadata,
  type SubscriptionPhase,
  type SubscriptionPhaseExtended,
  type SubscriptionPhaseMetadata,
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
    result: {
      subscriptionId: string
      phaseId: string
      status: S
      invoiceId?: string
      total?: number
      paymentInvoiceId?: string
    }
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

// The main idea with this class is creating transitions to handle the complexity of the life cycle of a subscription
// One thing to keep in mind is every transition has to be idempotent. Which means can be executed multiple times without duplicating data.
// This is important for the retry mechanism to work as expected. Specially because most of the time we call this machine from background jobs.
export class SubscriptionStateMachine extends StateMachine<
  PhaseStatus,
  SubscriptionEventMap<PhaseStatus>,
  keyof SubscriptionEventMap<PhaseStatus>
> {
  private readonly activePhase: SubscriptionPhaseExtended
  private readonly subscription: Subscription
  private readonly customer: Customer
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly analytics: Analytics
  private readonly isTest: boolean

  constructor({
    db,
    activePhase,
    subscription,
    customer,
    logger,
    analytics,
    isTest = false,
  }: {
    db: Database | TransactionDatabase
    activePhase: SubscriptionPhaseExtended
    subscription: Subscription
    customer: Customer
    logger: Logger
    analytics: Analytics
    isTest?: boolean
  }) {
    // the initial state of the machine
    super(activePhase.status)

    this.activePhase = activePhase
    this.subscription = subscription
    this.customer = customer
    this.db = db
    this.logger = logger
    this.analytics = analytics
    this.isTest = isTest ?? false
    /*
     * END_TRIAL
     * validate end of trial and generate an invoice for the subscription
     * if the subscription has to be invoice in advance, we try to collect the payment
     */
    this.addTransition({
      from: ["trialing"],
      to: ["active", "past_dued"],
      event: "END_TRIAL",
      onTransition: async (payload) => {
        // for subscriptions coming from trial, the cycle is the start of the phase to the end of the trial.
        // the end of the trial is the data for invoicing as well
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
        if (activePhase.trialEndsAt && activePhase.trialEndsAt >= payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Trial has not ended yet" }))
        }

        // validate the payment method
        const validatePaymentMethod = await this.validateCustomerPaymentMethod()

        if (validatePaymentMethod.err) {
          return Err(validatePaymentMethod.err)
        }

        // ending the trial means renewing the subscription
        // we update invoice date and subscription dates
        const renewSubscriptionResult = await this.renewSubscription({
          isTrial: true,
          now: payload.now,
        })

        if (renewSubscriptionResult.err) {
          return Err(renewSubscriptionResult.err)
        }

        // for phases that are billed in arrear, we don't do anything more
        // but we already validate the payment method so we are kind of sure the payment will be collected
        if (activePhase.whenToBill === "pay_in_arrear") {
          // if the subscription is renewed, we set the state to active
          return await this.syncState({
            state: "active",
            phaseId: activePhase.id,
            active: true,
          })
        }

        // for subscription that are billed in advance, we need to invoice the customer, and wait for the payment to be collected
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now,
          isEndTrial: true,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        // collect the payment will set the subscription to active or past_due
        const payment = await this.collectInvoicePayment({
          invoice: invoice.val.invoice,
          now: payload.now,
          autoFinalize: true,
        })

        if (payment.err) {
          return Err(payment.err)
        }

        return Ok({
          status: activePhase.status,
          phaseId: activePhase.id,
          subscriptionId: subscription.id,
          invoiceId: payment.val.invoiceId,
          paymentInvoiceId: payment.val.paymentInvoiceId,
          total: payment.val.total,
        })
      },
    })

    /*
     * INVOICE
     * create an invoice for the subscription phase
     */
    this.addTransition({
      from: ["active"],
      to: ["past_dued", "active"],
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

        // invoice can be created any time in the cycle
        // but only will be due at the end or start of the cycle
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        // in order to finalize an invoice it must be due
        const result = await this.finalizeInvoice({
          invoice: invoice.val.invoice,
          now: payload.now,
        })

        if (result.err) {
          return Err(result.err)
        }

        return Ok({
          invoiceId: invoice.val.invoice.id,
          status: activePhase.status,
        })
      },
    })

    /*
     * COLLECT_PAYMENT
     * collect the payment for the invoice
     */
    this.addTransition({
      from: ["past_dued", "active"],
      to: ["active", "past_dued"],
      event: "COLLECT_PAYMENT",
      onTransition: async (payload) => {
        const invoice = await this.getInvoice(payload.invoiceId)

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
          status: activePhase.status,
          paymentStatus: result.val.status,
          retries: result.val.retries,
          invoiceId: invoice.id,
        })
      },
    })

    /*
     * RENEW
     * set the new cycle for the subscription
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

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // TODO: renew should reset the usage
        const renewSubscription = await this.renewSubscription({
          isTrial: false,
          now: payload.now,
        })

        if (renewSubscription.err) {
          return Err(renewSubscription.err)
        }

        return Ok({
          status: activePhase.status,
        })
      },
    })

    /*
     * CANCEL
     * cancel the phase in the given date, if the date is in the past the phase is canceled immediately
     */
    this.addTransition({
      from: ["active", "trialing"],
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

        // TODO: cancel should set end date to the entitlements
        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: cancelAt, // end date of the phase is the date
          now: payload.now,
          isCancel: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

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

        const changeAt = payload.changeAt ?? subscription.currentCycleEndAt

        // changing a subscription mean creating a new phase
        // the creation of the new phase can happens outside the machine
        // It's just a new phase that is it.
        // this way the machine only takes care of the active phase
        // and we don't overcomplicate it handling multiple phases
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: changeAt, // end date of the phase is the date
          now: payload.now,
          isChange: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
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

        const expiresAt = payload.expiresAt ?? subscription.currentCycleEndAt

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: expiresAt, // end date of the phase is the date
          now: payload.now,
          isExpire: true,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
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
    state?: PhaseStatus
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
  }): Promise<
    Result<
      {
        subscriptionId: string
        phaseId: string
        status: PhaseStatus
      },
      UnPriceSubscriptionError
    >
  > {
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
            active: active ?? subscription.active,
            // update the subscription dates
            ...(subscriptionDates ? subscriptionDates : undefined),
            ...(metadataSubscription
              ? {
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
            ...(metadataPhase
              ? {
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

        // when testing we mock bd calls so we need to sync this way
        if (this.isTest) {
          Object.assign(subscriptionUpdated ?? {}, {
            ...subscription,
            ...{
              active: active ?? subscription.active,
              // update the subscription dates
              ...(subscriptionDates ? subscriptionDates : undefined),
              ...(metadataSubscription
                ? {
                    metadata: metadataSubscription,
                  }
                : undefined),
            },
          })

          Object.assign(phaseUpdated ?? {}, {
            ...activePhase,
            ...{
              status: state ?? activePhase.status,
              active: active ?? activePhase.active,
              ...(phaseDates ? phaseDates : undefined),
              ...(metadataPhase
                ? {
                    metadata: metadataPhase,
                  }
                : undefined),
            },
          })
        }

        // sync the active phase and subscription with the new values
        phaseUpdated && this.setActivePhase(phaseUpdated)
        subscriptionUpdated && this.setSubscription(subscriptionUpdated)

        return Ok({
          subscriptionId: subscription.id,
          phaseId: activePhase.id,
          status: state ?? activePhase.status,
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

  public getActivePhase(): SubscriptionPhaseExtended {
    return this.activePhase
  }

  public getSubscription(): Subscription {
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

  private async renewSubscription({
    isTrial = false,
    now,
  }: {
    isTrial?: boolean
    now: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    const subscription = this.getSubscription()
    const activePhase = this.getActivePhase()
    const autoRenew = activePhase.autoRenew

    // for trial we don't need to check if the subscription is auto renewing
    if (!autoRenew && !isTrial) {
      return Err(new UnPriceSubscriptionError({ message: "Subscription is not auto renewing" }))
    }

    // subscription can only be renewed if they are active or trialing
    if (!["active", "trialing"].includes(activePhase.status)) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is not active or trialing" })
      )
    }

    // calculate next billing cycle
    // here we calculate the next billing cycle, in order to do that we add a millisecond to the current cycle end date example:
    // if the current cycle end date is 2023-12-31T23:59:59Z we add a millisecond to get 2024-01-01T00:00:00.000Z
    // so we keep continuity with the current cycle
    const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
      currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
      billingCycleStart: activePhase.startCycle, // start day of the billing cycle
      billingPeriod: activePhase.planVersion?.billingPeriod ?? "month", // billing period
      endAt: activePhase.endAt ?? undefined, // end day of the billing cycle if any
    })

    // Check if the calculated cycle end is after any scheduled change, cancel or expiry dates
    if (subscription.changeAt || subscription.cancelAt || subscription.expiresAt) {
      const changeDate = subscription.changeAt ? new Date(subscription.changeAt) : null
      const cancelDate = subscription.cancelAt ? new Date(subscription.cancelAt) : null
      const expiryDate = subscription.expiresAt ? new Date(subscription.expiresAt) : null

      // Check if the calculated cycle end date is after any of the scheduled dates that exist
      if (
        (changeDate && cycleEnd > changeDate) ||
        (cancelDate && cycleEnd > cancelDate) ||
        (expiryDate && cycleEnd > expiryDate)
      ) {
        // TODO: should I just end the phase here?
        return Err(
          new UnPriceSubscriptionError({
            message:
              "Subscription cannot be renewed, it's scheduled to end in the future and the cycle end date is after the scheduled date",
          })
        )
      }
    }

    const whenToBill = activePhase.whenToBill

    // check if the subscription was already renewed
    // check the new cycle start and end dates are between now
    if (now >= subscription.currentCycleStartAt && now < subscription.currentCycleEndAt) {
      return Ok(undefined)
      // TODO: better return an error?
    }

    // renewing a phase implies setting the new cycle for the subscription
    const syncStateResult = await this.syncState({
      state: isTrial ? "trialing" : "active",
      phaseId: activePhase.id,
      active: true,
      subscriptionDates: {
        previousCycleStartAt: subscription.currentCycleStartAt,
        previousCycleEndAt: subscription.currentCycleEndAt,
        currentCycleStartAt: cycleStart.getTime(),
        currentCycleEndAt: cycleEnd.getTime(),
        // next invoice date is the start of the cycle if the subscription is pay in advance
        // or the end of the cycle if the subscription is pay in arrear
        nextInvoiceAt: whenToBill === "pay_in_advance" ? cycleStart.getTime() : cycleEnd.getTime(),
        // past due is reset in the renew
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
  }): Promise<
    Result<
      {
        status: PhaseStatus
        phaseId: string
        subscriptionId: string
      },
      UnPriceSubscriptionError
    >
  > {
    const { endAt, now, isCancel = false, isChange = false, isExpire = false } = payload
    // get active phase
    const activePhase = this.getActivePhase()
    const subscription = this.getSubscription()
    // if the subscription we skip the invoice part
    const isTrial = activePhase.status === "trialing"

    let finalState: PhaseStatus
    let reason: "pending_cancellation" | "pending_change" | "pending_expiration"
    let note: string

    if (isCancel) {
      finalState = "canceled"
      reason = "pending_cancellation"
      note = "Phase is being canceled, waiting for invoice and payment"
    } else if (isChange) {
      finalState = "changed"
      reason = "pending_change"
      note = "Phase is being changed, waiting for invoice and payment"
    } else if (isExpire) {
      finalState = "expired"
      reason = "pending_expiration"
      note = "Phase is expiring, waiting for invoice and payment"
    } else if (isTrial) {
      finalState = "trialing"
      reason = "pending_cancellation"
      note = "Canceled after trial period ended, waiting for invoice and payment"
    } else {
      finalState = "canceled"
      reason = "pending_cancellation"
      note = "Phase is being canceled, waiting for invoice and payment"
    }

    // cannot cancel a phase if the subscription is changing
    if (subscription.changeAt && subscription.changeAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({
          message: "The subscription is changing, wait for the change to be applied",
        })
      )
    }

    // if cannot cancel a subscription that is expiring
    if (subscription.expiresAt && subscription.expiresAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is expiring, wait for it to expire" })
      )
    }

    // if cannot cancel a subscription that is already canceling
    if (subscription.cancelAt && subscription.cancelAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is already canceling, wait for it to be canceled",
        })
      )
    }

    // if subscription is not ready to be canceled, send an error
    // before applying the end date we need to sync the state
    if (endAt > now) {
      // we set the dates and the next invoice at the end date
      // so next time we call the machine we will know what to do
      await this.syncState({
        phaseId: activePhase.id,
        subscriptionDates: {
          ...(isCancel || isTrial ? { cancelAt: endAt } : {}),
          ...(isChange ? { changeAt: endAt } : {}),
          ...(isExpire ? { expiredAt: endAt } : {}),
          // the next invoice is the end at date
          nextInvoiceAt: endAt,
          currentCycleEndAt: endAt,
        },
        phaseDates: {
          ...(isCancel ? { endAt } : {}),
          ...(isChange ? { endAt } : {}),
          ...(isExpire ? { endAt } : {}),
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

      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is not ready to be ended. The ending was scheduled",
        })
      )
    }

    // skip the invoice part if the subscription is a trial
    if (!isTrial) {
      // at this point the end should be applied immediately
      // we need to get the last paid invoice for the phase
      const paidInvoice = await this.getPhaseInvoiceByStatus({
        phaseId: activePhase.id,
        startAt: subscription.currentCycleStartAt,
        status: "paid",
      })

      // for paid invoices we need to prorate the invoice
      // this means the customer has already paid for the current cycle
      if (paidInvoice && paidInvoice.whenToBill === "pay_in_advance") {
        // we need to prorate the flat charges for the current cycle, which
        // means we calculate how much the customer has already paid for the cycle
        // and we create a credit for the difference
        // we don't worry about usage charges because those are calculated
        // in the invoice part and don't need proration
        const proratedInvoice = await this.prorateInvoice({
          invoiceId: paidInvoice.id,
          now: payload.now,
          startAt: paidInvoice.cycleStartAt,
          endAt: endAt, // this should be the end date passed in the payload
        })

        if (proratedInvoice.err) {
          return Err(proratedInvoice.err)
        }
      }

      // create an invoice for the ended phase. If there is an open invoice, we don't create a new one
      // but we will use the existing one to apply discount and charge usage if any
      // the invoice behaviour will change depending on the reason of the end
      const invoiceResult = await this.createInvoiceSubscriptionActivePhase({
        now: payload.now,
        isCancel,
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
    }

    // update the subscription dates
    // if something happens in the collection payment it will be handle
    // by the invoice machine
    await this.syncState({
      state: finalState,
      phaseId: activePhase.id,
      active: false,
      subscriptionDates: {
        ...(isCancel ? { canceledAt: endAt } : {}),
        ...(isChange ? { changedAt: endAt } : {}),
        ...(isExpire ? { expiredAt: endAt } : {}),
      },
    })

    return Ok({
      status: finalState,
      phaseId: activePhase.id,
      subscriptionId: this.subscription.id,
    })
  }

  // check if the subscription requires a payment method and if the customer has one
  // if the plan version does not require a payment method, we don't need to validate
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
    // whether the invoice is created in a trial end stage
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

    // check if the phase is active
    if (!phase.active || !["trialing", "active"].includes(currentState)) {
      return Err(
        new UnPriceSubscriptionError({ message: "Phase is not active or not ready to invoice" })
      )
    }

    // if the subscription is not ready to be invoiced we send an err
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is not ready to be invoiced" })
      )
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
      },
    })

    return Ok({
      invoice,
    })
  }

  // given an invoice that is already paid, we need to prorate the flat charges
  // this is normally done when a phase is canceled mid cycle and the when to invoice is pay in advance
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
      // when we create the invoice we save metadata with the subscription item id
      const invoiceFlatItem = invoiceProratedFlatItemsPrice.val?.items.find(
        (i) =>
          // product id is the feature id (invoices are created for each feature)
          i.productId === productId ||
          // subscription item id is the feature id (invoices are created for each feature)
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
            note: `Refund for the prorated flat charges from ${startAt} to ${endAt} from invoice ${invoiceId}`,
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
  // this means we are going to create an invoice in the payment provider
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

    // invoices can be finilize after due date only
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

      // could be possible the invoice is open and the customer cancel the phase
      // then we need to update the cycle dates
      // this can happen in the grace period for the subscription
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
      // create a new invoice if there is no invoice id in the invoice
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
    })

    if (invoiceItemsPrice.err) {
      return Err(invoiceItemsPrice.err)
    }

    // upsert the invoice items in the payment provider
    for (const item of invoiceItemsPrice.val.items) {
      // depending on the payment provider, the amount is in different unit
      // get the total amount of the invoice item given the quantity and proration
      const formattedTotalAmountItem = paymentProviderService.formatAmount(
        item.price.totalPrice.dinero
      )

      const formattedUnitAmountItem = paymentProviderService.formatAmount(
        item.price.unitPrice.dinero
      )

      if (formattedTotalAmountItem.err || formattedUnitAmountItem.err) {
        return Err(
          new UnPriceSubscriptionError({
            message: `Error formatting amount: ${
              formattedTotalAmountItem.err?.message ?? formattedUnitAmountItem.err?.message
            }`,
          })
        )
      }

      // sum up every item to calculate the subtotal of the invoice
      paymentProviderInvoiceData.subtotal += formattedUnitAmountItem.val.amount * item.quantity

      // upsert the invoice item in the payment provider
      const invoiceItemExists = invoiceData.items.find(
        (i) =>
          i.productId === item.productId ||
          i.metadata?.subscriptionItemId === item.metadata?.subscriptionItemId
      )

      // invoice item already exists, we need to update the amount and quantity
      if (invoiceItemExists) {
        const updateItemInvoice = await paymentProviderService.updateInvoiceItem({
          invoiceItemId: invoiceItemExists.id,
          totalAmount: formattedTotalAmountItem.val.amount,
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
        const itemInvoice = await paymentProviderService.addInvoiceItem({
          invoiceId: invoiceData.invoiceId,
          name: item.productSlug,
          // TODO: uncomment when ready
          // for testing we don't send the product id so we can create the
          // invoice item without having to create the product in the payment provider
          ...(this.isTest ? {} : { productId: item.productId }),
          // productId: item.productId.startsWith("feature-") ? undefined : item.productId,
          isProrated: item.prorate !== 1,
          totalAmount: formattedTotalAmountItem.val.amount,
          unitAmount: formattedUnitAmountItem.val.amount,
          description: item.description,
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

    // update the invoice data
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

    // if there is a credit and the remaining amount is greater than the invoice subtotal,
    // we discount the substotal from the credit
    // if not we apply the entire credit to the invoice
    // either case we need to update the credit with the amount used
    // and create a negative charge for the invoice in the payment provider
    if (customerCreditId) {
      // set the customer credit id to the invoice
      paymentProviderInvoiceData.customerCreditId = customerCreditId

      const remainingCredit = credits.totalAmount - credits.amountUsed

      // set the total amount of the credit
      if (remainingCredit >= paymentProviderInvoiceData.subtotal) {
        amountCreditUsed = paymentProviderInvoiceData.subtotal
      } else {
        amountCreditUsed = remainingCredit
      }

      if (amountCreditUsed > 0) {
        // we need to check if the invoice item already exists (credit charge)
        const creditChargeExists = invoiceData.items.find(
          (i) => i.metadata?.creditId === customerCreditId
        )

        if (creditChargeExists) {
          const creditCharge = await paymentProviderService.updateInvoiceItem({
            invoiceItemId: creditChargeExists.id,
            totalAmount: -amountCreditUsed,
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
            totalAmount: -amountCreditUsed,
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
    } else {
      paymentProviderInvoiceData.status = "unpaid"
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

        // if it's a test, we need to assign the invoice id and url from the invoice
        if (this.isTest) {
          Object.assign(updatedInvoice, {
            ...invoice,
            ...updatedInvoice,
          })
        }

        // update the state of the subscription
        await this.syncState({
          phaseId: invoice.subscriptionPhaseId,
          // void means the invoice not need to be paid, so we set the subscription to active
          state: paymentProviderInvoiceData.status === "void" ? "active" : "past_dued",
          subscriptionDates: {
            pastDueAt:
              paymentProviderInvoiceData.status === "void" ? undefined : updatedInvoice.pastDueAt,
            lastInvoiceAt: payload.now,
          },
          metadataSubscription:
            paymentProviderInvoiceData.status === "void"
              ? {}
              : {
                  note: "Waiting for payment",
                  reason: "payment_pending",
                },
          metadataPhase:
            paymentProviderInvoiceData.status === "void"
              ? {}
              : {
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
      {
        status: InvoiceStatus
        retries: number
        pastDueAt: number | undefined
        total: number
        invoiceId: string
        paymentInvoiceId?: string
      },
      UnPriceSubscriptionError
    >
  > {
    const { invoice, now, autoFinalize = false } = payload

    let invoiceData = invoice

    // invoices need to be finalized before collecting the payment
    // finalizing the invoice will create the invoice in the payment provider
    // the invoice by default is created in our system as draft so we can apply changes to it
    // before sending it to the payment provider
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
    const {
      collectionMethod,
      paymentProvider,
      invoiceId,
      status,
      paymentAttempts,
      pastDueAt,
      dueAt,
    } = invoiceData

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
      return Ok({
        status: status,
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // if the invoice is draft, we can't collect the payment
    if (status === "draft") {
      return Err(
        new UnPriceSubscriptionError({ message: "Invoice is draft, cannot collect payment" })
      )
    }

    // by this point the invoice is closed and it should have an invoice id from the payment provider
    if (!invoiceId) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice is closed, but has no invoice id from the payment provider",
        })
      )
    }

    // TODO: does it makes sense to collect payment from invoices with total 0?

    // validate if the invoice is failed
    if (status === "failed") {
      // meaning the invoice is past due and we cannot collect the payment with 3 attempts
      return Ok({
        status: "failed",
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // if the invoice is waiting, we need to check if the payment is successful
    // waiting mean we sent the invoice to the customer and we are waiting for the payment (manual payment)
    if (status === "waiting") {
      // check the status of the payment in the provider
      const statusInvoice = await paymentProviderService.getStatusInvoice({
        invoiceId: invoiceId,
      })

      if (statusInvoice.err) {
        return Err(new UnPriceSubscriptionError({ message: "Error getting invoice status" }))
      }

      // if the invoice is paid or void, we update the invoice status
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
          subscriptionDates: {
            pastDueAt: undefined,
          },
        })

        return Ok({
          status: statusInvoice.val.status,
          retries: updatedInvoice.paymentAttempts?.length ?? 0,
          pastDueAt,
          total: invoiceData.total,
          invoiceId: invoice.id,
          paymentInvoiceId: invoiceData.invoiceId ?? undefined,
        })
      }

      // the past due date is past then we need to update the subscription to past_due
      if (pastDueAt > now) {
        await this.syncState({
          phaseId: invoice.subscriptionPhaseId,
          state: "past_dued",
          metadataSubscription: {
            note: "Invoice exceeded the payment due date",
            reason: "payment_pending",
          },
          metadataPhase: {
            note: "Invoice exceeded the payment due date",
            reason: "payment_pending",
          },
        })

        // mark the invoice as failed
        await this.db
          .update(invoices)
          .set({
            status: "failed",
            metadata: { note: "Invoice exceeded the payment due date" },
          })
          .where(eq(invoices.id, invoice.id))

        return Ok({
          status: "failed",
          retries: paymentAttempts?.length ?? 0,
          pastDueAt,
          total: invoiceData.total,
          invoiceId: invoice.id,
          paymentInvoiceId: invoiceData.invoiceId ?? undefined,
        })
      }

      // if the invoice is not paid yet, we keep waiting for the payment
      return Ok({
        status: "waiting",
        retries: paymentAttempts?.length ?? 0,
        pastDueAt,
        total: invoiceData.total,
        invoiceId: invoice.id,
        paymentInvoiceId: invoiceData.invoiceId ?? undefined,
      })
    }

    // 3 attempts max for the invoice
    if (paymentAttempts?.length && paymentAttempts.length >= 3) {
      // update the invoice status
      await this.db
        .update(invoices)
        .set({
          status: "failed",
          metadata: { note: "Invoice has reached the maximum number of payment attempts" },
        })
        .where(eq(invoices.id, invoice.id))

      // update the subscription dates
      await this.syncState({
        phaseId: invoice.subscriptionPhaseId,
        state: "past_dued",
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

    // at this point the invoice is not paid yet and we are not waiting for the payment
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

      const paymentStatus = stripePaymentInvoice.val.status

      // update the invoice status if the payment is successful
      // if not add the failed attempt
      await this.db
        .update(invoices)
        .set({
          status: ["paid", "void"].includes(paymentStatus) ? "paid" : "unpaid",
          ...(["paid", "void"].includes(paymentStatus) ? { paidAt: Date.now() } : {}),
          paymentAttempts: [
            ...(paymentAttempts ?? []),
            {
              status: ["paid", "void"].includes(paymentStatus) ? "paid" : "failed",
              createdAt: Date.now(),
            },
          ],
        })
        .where(eq(invoices.id, invoice.id))

      // update the subscription dates if the payment is successful
      if (paymentStatus === "paid" || paymentStatus === "void") {
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
      } else {
        result = "unpaid"
      }
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
          sentAt: Date.now(),
          metadata: {
            ...(invoice.metadata ?? {}),
            note: "Invoice sent to the customer, waiting for payment",
          },
        })
        .where(eq(invoices.id, invoice.id))

      result = "waiting"
    }

    return Ok({
      status: result,
      retries: paymentAttempts?.length ?? 0,
      pastDueAt,
      total: invoiceData.total,
      invoiceId: invoiceData.id,
      paymentInvoiceId: invoiceData.invoiceId ?? undefined,
    })
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
          featureType: FeatureType
          productId: string
          price: CalculatedPrice
          quantity: number
          prorate: number
          productSlug: string
          type: FeatureType
          description?: string
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

    // TODO: do I need to calculate the cycle here again?
    // calculate proration for the current billing cycle
    // will return the proration factor given the start and end of the cycle
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      currentCycleStartAt: cycleStartAt,
      billingCycleStart: phase.startCycle,
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
      // create a item for each feature
      for (const item of billableItems) {
        let prorate = proration

        // proration is supported for fixed cost items - not for usage
        if (item.featurePlanVersion.featureType === "usage") {
          prorate = 1 // bill usage as full price
        }

        // calculate the quantity of the feature
        let quantity = 0

        // get the usage depending on the billing type
        // when billing at the end of the cycle we get the usage for the current cycle + fixed price from current cycle
        if (!shouldBillInAdvance) {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)) {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            const usage = await this.analytics
              .getTotalUsagePerFeature({
                featureSlug: item.featurePlanVersion.feature.slug,
                subscriptionItemId: item.id,
                projectId: subscription.projectId,
                customerId: this.customer.id,
                // get usage for the current cycle
                start: cycleStartAt,
                end: cycleEndAt,
              })
              .then((usage) => {
                return usage.data[0]
              })

            const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

            // the amount of units the customer used in the current cycle
            quantity = units
          }
        } else {
          // get usage only for usage features - the rest are calculated from the subscription items
          if (["flat", "tier", "package"].includes(item.featurePlanVersion.featureType)) {
            quantity = item.units! // all non usage features have a quantity the customer bought in the subscription
          } else {
            // For billing in advance we need to get the usage for the previous cycle if any
            // this way we combine one single invoice for the cycle
            if (previousCycleStartAt && previousCycleEndAt) {
              // get usage for the current cycle
              const usage = await this.analytics
                .getTotalUsagePerFeature({
                  featureSlug: item.featurePlanVersion.feature.slug,
                  projectId: subscription.projectId,
                  subscriptionItemId: item.id,
                  customerId: this.customer.id,
                  start: previousCycleStartAt,
                  end: previousCycleEndAt,
                })
                .then((usage) => usage.data[0])

              const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

              // the amount of units the customer used in the previous cycle
              quantity = units
            }
          }
        }

        // this should never happen but we add a check anyway just in case
        if (quantity < 0) {
          // throw and cancel execution
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

        // give good description per item type so the customer can identify the charge
        // take into account if the charge is prorated or not
        // add the period of the charge if prorated
        let description = undefined

        if (item.featurePlanVersion.featureType === "usage") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - usage`
        } else if (item.featurePlanVersion.featureType === "flat") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - flat`
        } else if (item.featurePlanVersion.featureType === "tier") {
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - tier`
        } else if (item.featurePlanVersion.featureType === "package") {
          // package is a special case, we need to calculate the quantity of packages the customer bought
          // we do it after the price calculation because we pass the package units to the payment provider
          const quantityPackages = Math.ceil(quantity / item.featurePlanVersion.config?.units!)
          quantity = quantityPackages
          description = `${item.featurePlanVersion.feature.title.toUpperCase()} - ${quantityPackages} package of ${item
            .featurePlanVersion.config?.units!} units`
        }

        if (prorate !== 1) {
          const startDate = new Date(Number(calculatedCurrentBillingCycle.cycleStart))
          const endDate = new Date(Number(calculatedCurrentBillingCycle.cycleEnd))
          const billingPeriod = `${startDate.toLocaleString("default", {
            month: "short",
          })} ${startDate.getDate()} - ${endDate.toLocaleString("default", {
            month: "short",
          })} ${endDate.getDate()}`

          description += ` prorated (${billingPeriod})`
        }

        // create an invoice item for each feature
        invoiceItems.push({
          featureType: item.featurePlanVersion.featureType,
          quantity,
          productId: item.featurePlanVersion.feature.id,
          price: priceCalculation.val,
          productSlug: item.featurePlanVersion.feature.slug,
          prorate: prorate,
          type: item.featurePlanVersion.featureType,
          description: description,
          metadata: {
            subscriptionItemId: item.id,
          },
        })

        // order invoice items by feature type
        invoiceItems.sort((a, b) => a.featureType.localeCompare(b.featureType))
      }

      return Ok({
        items: invoiceItems,
      })
    } catch (e) {
      const error = e as Error
      return Err(new UnPriceSubscriptionError({ message: `Unhandled error: ${error.message}` }))
    }
  }

  public async renew(payload: { now: number }): Promise<
    Result<{ status: PhaseStatus }, UnPriceSubscriptionError>
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
    Result<
      { status: string; invoiceId?: string; total?: number; paymentInvoiceId?: string },
      UnPriceSubscriptionError
    >
  > {
    const { now } = payload

    const endTrial = await this.transition("END_TRIAL", { now })

    if (endTrial.err) {
      return Err(endTrial.err)
    }

    return Ok({
      status: endTrial.val.status,
      invoiceId: endTrial.val.invoiceId,
      total: endTrial.val.total,
      paymentInvoiceId: endTrial.val.paymentInvoiceId,
    })
  }

  public async invoice(payload: { now: number }): Promise<
    Result<{ invoiceId: string }, UnPriceSubscriptionError>
  > {
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
      { paymentStatus: string; retries: number; status: PhaseStatus },
      UnPriceSubscriptionError
    >
  > {
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
    Result<{ status: PhaseStatus }, UnPriceSubscriptionError>
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
    Result<{ status: PhaseStatus }, UnPriceSubscriptionError>
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
    Result<{ status: PhaseStatus }, UnPriceSubscriptionError>
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
