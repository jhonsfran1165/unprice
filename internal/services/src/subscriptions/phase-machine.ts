import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import {
  customerEntitlements,
  invoices,
  subscriptionPhases,
  subscriptions,
} from "@unprice/db/schema"
import { AesGCM, newId } from "@unprice/db/utils"
import {
  type Customer,
  type InvoiceType,
  type PhaseStatus,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionMetadata,
  type SubscriptionPhase,
  type SubscriptionPhaseExtended,
  type SubscriptionPhaseMetadata,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { addDays } from "date-fns"
import { env } from "../env.mjs"
import { StateMachine } from "../machine/service"
import { PaymentProviderService } from "../payment-provider"
import { UnPriceSubscriptionError } from "./errors"
import { InvoiceStateMachine } from "./invoice-machine"

// all event operate with the now parameter which is the timestamp of the event
// this allows us to handle the events in a deterministic way
// also allow us to mock future events for testing purposes, like when we want to test the subscription renewal, invoices, etc
export type PhaseEventMap<S extends string> = {
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
    payload: { now: number; cancelAt?: number; metadata?: SubscriptionPhaseMetadata }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  EXPIRE: {
    payload: { now: number; expiresAt?: number; metadata?: SubscriptionPhaseMetadata }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  PAST_DUE: {
    payload: { now: number; pastDueAt?: number; metadata?: SubscriptionPhaseMetadata }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
  CHANGE: {
    payload: {
      now: number
      changeAt?: number
      metadata?: SubscriptionPhaseMetadata
    }
    result: { status: S; changedAt: number }
    error: UnPriceSubscriptionError
  }
  INVOICE: {
    payload: { now: number }
    result: { invoice: SubscriptionInvoice; status: S }
    error: UnPriceSubscriptionError
  }
  REPORT_PAYMENT: {
    payload: { now: number; invoiceId: string }
    result: { status: S }
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
export class PhaseMachine extends StateMachine<
  PhaseStatus,
  PhaseEventMap<PhaseStatus>,
  keyof PhaseEventMap<PhaseStatus>
> {
  private readonly phase: SubscriptionPhaseExtended
  private readonly subscription: Subscription
  private readonly customer: Customer
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly paymentProviderService: PaymentProviderService
  private readonly analytics: Analytics
  private readonly isTest: boolean

  constructor({
    db,
    phase,
    subscription,
    customer,
    logger,
    analytics,
    isTest = false,
    paymentProviderToken,
  }: {
    db: Database | TransactionDatabase
    phase: SubscriptionPhaseExtended
    subscription: Subscription
    customer: Customer
    logger: Logger
    analytics: Analytics
    isTest?: boolean
    paymentProviderToken: string
  }) {
    // the initial state of the machine
    super(phase.status)

    this.phase = phase
    this.subscription = subscription
    this.customer = customer
    this.db = db
    this.logger = logger
    this.analytics = analytics
    this.isTest = isTest ?? false

    this.paymentProviderService = new PaymentProviderService({
      customer,
      paymentProvider: phase.planVersion.paymentProvider,
      logger,
      token: paymentProviderToken,
    })

    // TODO: add isFinalState to the machine so we can handle the final states

    /*
     * END_TRIAL
     * set new status for the subscription and phase and renew the subscription so it can be invoiced
     */
    this.addTransition({
      from: ["trialing"],
      to: ["trial_ended", "active"],
      event: "END_TRIAL",
      onTransition: async (payload) => {
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })

        if (err) {
          return Err(err)
        }

        // check if the trial has ended if not don't do anything
        if (activePhase.trialEndsAt && activePhase.trialEndsAt >= payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Trial has not ended yet" }))
        }

        // validate the payment method
        const validatePaymentMethod = await this.validateCustomerPaymentMethod({
          now: payload.now,
        })

        if (validatePaymentMethod.err) {
          return Err(validatePaymentMethod.err)
        }

        // ending the trial means renewing the subscription
        const renewSubscriptionResult = await this.renewActivePhase({
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

        return await this.syncState({
          state: "trial_ended",
          phaseId: activePhase.id,
          active: true,
          metadataSubscription: {
            reason: "trial_ended",
            note: "Trial ended pending invoice",
          },
          metadataPhase: {
            reason: "trial_ended",
            note: "Trial ended pending invoice",
          },
        })
      },
    })

    /*
     * INVOICE
     * create an invoice for the subscription phase. Includes active and pending statuses
     */
    this.addTransition({
      from: ["trial_ended", "active"],
      to: ["trial_ended", "active"],
      event: "INVOICE",
      onTransition: async (payload) => {
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })

        if (err) {
          return Err(err)
        }

        // invoice can be created any time in the cycle
        // but only will be due at the end or start of the cycle
        const invoice = await this.createInvoiceSubscriptionActivePhase({
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        // update subscription dates
        await this.syncState({
          phaseId: activePhase.id,
          subscriptionDates: {
            pastDueAt: invoice.val.invoice.pastDueAt,
            lastInvoiceAt: payload.now,
          },
        })

        return Ok({
          invoice: invoice.val.invoice,
          status: activePhase.status,
        })
      },
    })

    /*
     * REPORT_PAYMENT
     * Apply expiration to the subscription
     */
    this.addTransition({
      from: ["past_dued", "active", "trial_ended"],
      to: ["active"],
      event: "REPORT_PAYMENT",
      onTransition: async (_payload) => {
        // reporting a payment means the invoice has been paid
        // we don't need the active phase because the invoice can be from any phase
        const phase = this.phase

        const invoice = await this.db.query.invoices.findFirst({
          where: eq(invoices.id, _payload.invoiceId),
        })

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        if (!["paid", "void"].includes(invoice.status)) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice is not paid yet" }))
        }

        await this.syncState({
          phaseId: phase.id,
          state: "active",
          active: true,
          subscriptionDates: {
            pastDueAt: undefined,
          },
          metadataPhase: {
            reason: "payment_received",
            note: "Payment received",
          },
          metadataSubscription: {
            reason: "payment_received",
            note: "Payment received",
          },
        })

        // if there is no invoice we just return the subscription state
        return Ok({
          status: phase.status,
          phaseId: phase.id,
          subscriptionId: this.subscription.id,
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
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })

        if (err) {
          return Err(err)
        }

        // TODO: renew should reset the usage
        const renewActivePhase = await this.renewActivePhase({
          now: payload.now,
        })

        if (renewActivePhase.err) {
          return Err(renewActivePhase.err)
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
      from: ["active", "trial_ended", "trialing"],
      to: ["canceled"],
      event: "CANCEL",
      onTransition: async (payload) => {
        const subscription = this.getSubscription()
        // if no cancel at is provided, we cancel at the end of the current cycle
        const cancelAt = payload.cancelAt ?? subscription.currentCycleEndAt
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })

        if (err) {
          return Err(err)
        }

        // TODO: cancel should set end date to the entitlements
        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: cancelAt, // end date of the phase is the date
          now: payload.now,
          isCancel: true,
          metadata: payload.metadata,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        return Ok({
          status: activePhase.status,
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
      to: ["changed"],
      event: "CHANGE",
      onTransition: async (payload) => {
        const subscription = this.getSubscription()
        // get active phase
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })

        if (err) {
          return Err(err)
        }

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
          metadata: payload.metadata,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: activePhase.status,
          changedAt: changeAt,
        })
      },
    })

    /*
     * EXPIRE
     * Apply expiration to the subscription
     */
    this.addTransition({
      from: ["active"],
      to: ["expired"],
      event: "EXPIRE",
      onTransition: async (payload) => {
        // get active phase
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })
        const subscription = this.getSubscription()

        if (err) {
          return Err(err)
        }

        const expiresAt = payload.expiresAt ?? subscription.currentCycleEndAt

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: expiresAt, // end date of the phase is the date
          now: payload.now,
          isExpire: true,
          metadata: payload.metadata,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: activePhase.status,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })

    /*
     * PAST_DUE
     * Apply past due to the subscription
     */
    this.addTransition({
      from: ["active"],
      to: ["past_dued"],
      event: "PAST_DUE",
      onTransition: async (payload) => {
        // get active phase
        const { err, val: activePhase } = this.getActivePhase({ now: payload.now })
        const subscription = this.getSubscription()

        if (err) {
          return Err(err)
        }

        const pastDueAt = payload.pastDueAt ?? subscription.currentCycleEndAt

        // end the phase
        const endPhaseResult = await this.endSubscriptionActivePhase({
          endAt: pastDueAt, // end date of the phase is the date
          now: payload.now,
          isPastDue: true,
          metadata: payload.metadata,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: activePhase.status,
          phaseId: activePhase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })
  }

  public getCustomer(): Customer {
    return this.customer
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
    Object.assign(this.phase, phase)
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
    const activePhase = this.phase
    const subscription = this.subscription

    try {
      return await this.db.transaction(async (tx) => {
        // update the subscription status
        const subscriptionUpdated = await tx
          .update(subscriptions)
          .set({
            active: active ?? activePhase.active,
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
          status: activePhase.status,
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

  public getActivePhase({
    now,
  }: {
    now: number
  }): Result<SubscriptionPhaseExtended, UnPriceSubscriptionError> {
    // we have to validate the phase is active given the date
    // a phase is active if the current date is between the start and end date
    // end date can be undefined, which means the phase is active until the subscription ends
    const phase = this.phase

    if (!phase.active) {
      return Err(new UnPriceSubscriptionError({ message: "Phase is not active" }))
    }

    if (now >= phase.startAt && (!phase.endAt || now <= phase.endAt)) {
      return Ok(phase)
    }

    return Err(new UnPriceSubscriptionError({ message: "Phase is not active" }))
  }

  public getPhase(): SubscriptionPhaseExtended {
    return this.phase
  }

  public getSubscription(): Subscription {
    return this.subscription
  }

  public async getPhaseInvoiceByStatus({
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

  private async renewActivePhase({
    now,
  }: {
    now: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    const subscription = this.subscription
    const { err, val: activePhase } = this.getActivePhase({ now })

    if (err) {
      return Err(err)
    }

    // subscription can only be renewed if they are active or trialing
    if (!["active", "trialing"].includes(activePhase.status)) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is not active or trialing" })
      )
    }

    const whenToBill = activePhase.whenToBill

    // before renewing the subscription we need to check if the subscription has already been invoiced
    // with this we make sure the cycle is correctly invoiced before renewing
    if (activePhase.status !== "trialing") {
      if (whenToBill === "pay_in_advance") {
        if (
          subscription.lastInvoiceAt &&
          subscription.lastInvoiceAt < subscription.currentCycleStartAt
        ) {
          return Err(
            new UnPriceSubscriptionError({
              message: "Subscription has not been invoiced. Invoice the current cycle first",
            })
          )
        }
      } else if (whenToBill === "pay_in_arrear") {
        if (
          subscription.lastInvoiceAt &&
          subscription.lastInvoiceAt < subscription.currentCycleEndAt
        ) {
          return Err(
            new UnPriceSubscriptionError({
              message: "Subscription has not been invoiced. Invoice the current cycle first",
            })
          )
        }
      }
    }

    // calculate next billing cycle
    // here we calculate the next billing cycle, in order to do that we add a millisecond to the current cycle end date example:
    // if the current cycle end date is 2023-12-31T23:59:59Z we add a millisecond to get 2024-01-01T00:00:00.000Z
    // so we keep continuity with the current cycle
    const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
      currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
      billingCycleStart: activePhase.startCycle, // start day of the billing cycle
      billingPeriod: activePhase.planVersion.billingPeriod, // billing period
      endAt: activePhase.endAt ?? undefined, // end day of the billing cycle if any
    })

    // Check if the calculated cycle end is after any scheduled change, cancel or expiry dates
    if (
      subscription.changeAt ||
      subscription.cancelAt ||
      subscription.expiresAt ||
      subscription.pastDueAt
    ) {
      const changeDate = subscription.changeAt ? new Date(subscription.changeAt) : null
      const cancelDate = subscription.cancelAt ? new Date(subscription.cancelAt) : null
      const expiryDate = subscription.expiresAt ? new Date(subscription.expiresAt) : null
      const pastDueDate = subscription.pastDueAt ? new Date(subscription.pastDueAt) : null

      // Check if the calculated cycle end date is after any of the scheduled dates that exist
      if (
        (changeDate && cycleEnd > changeDate) ||
        (cancelDate && cycleEnd > cancelDate) ||
        (expiryDate && cycleEnd > expiryDate) ||
        (pastDueDate && cycleEnd > pastDueDate)
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

    // TODO: renew usage for the phase
    // TODO: renew entitlements for the phase

    // check if the subscription was already renewed
    // check the new cycle start and end dates are between now
    if (now >= subscription.currentCycleStartAt && now < subscription.currentCycleEndAt) {
      return Ok(undefined)
    }

    // renewing a phase implies setting the new cycle for the subscription
    const syncStateResult = await this.syncState({
      state: activePhase.status === "trialing" ? "trial_ended" : "active",
      phaseId: activePhase.id,
      active: true,
      subscriptionDates: {
        previousCycleStartAt: subscription.currentCycleStartAt,
        previousCycleEndAt: subscription.currentCycleEndAt,
        currentCycleStartAt: cycleStart.getTime(),
        currentCycleEndAt: cycleEnd.getTime(),
        // next invoice date is the start of the cycle if the subscription is pay in advance
        // or the end of the cycle if the subscription is pay in arrear
        // we add a millisecond to be sure we invoice the whole cycle
        nextInvoiceAt:
          whenToBill === "pay_in_advance" ? cycleStart.getTime() + 1 : cycleEnd.getTime() + 1,
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
    isPastDue?: boolean
    metadata?: SubscriptionPhaseMetadata
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
    const {
      endAt,
      now,
      isCancel = false,
      isChange = false,
      isExpire = false,
      isPastDue = false,
      metadata,
    } = payload
    // get active phase
    const { err, val: activePhase } = this.getActivePhase({ now })

    if (err) {
      return Err(err)
    }

    const subscription = this.getSubscription()
    // if the subscription we skip the invoice part
    const isTrial = activePhase.status === "trialing"

    let finalState: PhaseStatus
    let reason: SubscriptionPhaseMetadata["reason"]
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
    } else if (isPastDue) {
      finalState = "past_dued"
      reason = "invoice_failed"
      note = "Invoice in past due, waiting for payment"
    } else {
      finalState = "canceled"
      reason = "pending_cancellation"
      note = "Phase is being canceled, waiting for invoice and payment"
    }

    // for cancelations on trailing the cancel date is the end of the trial
    if (activePhase.status === "trialing" && endAt !== activePhase.trialEndsAt) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "This subscription phase is trialig, the cancelation date has to be the same as the end of the trial",
        })
      )
    }

    // if metadata is passed in, we use it to set the reason and note
    if (metadata) {
      reason = metadata.reason ?? reason
      note = metadata.note ?? note
    }

    // cannot cancel a phase if the subscription is changing
    if (subscription.changeAt && subscription.changeAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({
          message: "The subscription is changing, wait for the change to be applied",
        })
      )
    }

    // we cannot cancel a subscription that is expiring
    if (subscription.expiresAt && subscription.expiresAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is expiring, wait for it to expire" })
      )
    }

    // we cannot cancel a subscription that is already canceling
    if (subscription.cancelAt && subscription.cancelAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is already canceling, wait for it to be canceled",
        })
      )
    }

    // we cannot change a subscription that is past due
    if (subscription.pastDueAt && subscription.pastDueAt > payload.now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is past due, wait for payment" })
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
          ...(isPastDue ? { pastDueAt: endAt } : {}),
          // the next invoice is the end at date
          nextInvoiceAt: endAt,
          currentCycleEndAt: endAt,
        },
        phaseDates: {
          ...(isCancel ? { endAt } : {}),
          ...(isChange ? { endAt } : {}),
          ...(isExpire ? { endAt } : {}),
          ...(isPastDue ? { endAt } : {}),
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

      // if all goes well we return the final state
      // the cancellation, change or expiration will be handled in by background jobs
      return Ok({
        status: finalState,
        phaseId: activePhase.id,
        subscriptionId: subscription.id,
      })
    }

    // skip the invoice part if the subscription is a trial or past due
    if (!isTrial && !isPastDue) {
      // at this point the end should be applied immediately
      // we need to get the last paid invoice for the phase
      const paidInvoice = await this.getPhaseInvoiceByStatus({
        phaseId: activePhase.id,
        startAt: subscription.currentCycleStartAt,
        status: "paid",
      })

      const configPaymentProvider = await this.db.query.paymentProviderConfig.findFirst({
        where: (config, { and, eq }) =>
          and(
            eq(config.projectId, activePhase.projectId),
            eq(config.paymentProvider, activePhase.planVersion.paymentProvider)
          ),
      })

      if (!configPaymentProvider) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Payment provider config not found",
          })
        )
      }

      const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

      const decryptedKey = await aesGCM.decrypt({
        iv: configPaymentProvider.keyIv,
        ciphertext: configPaymentProvider.key,
      })

      // for paid invoices we need to prorate the invoice
      // this means the customer has already paid for the current cycle
      if (paidInvoice && paidInvoice.whenToBill === "pay_in_advance") {
        // we need to prorate the flat charges for the current cycle, which
        // means we calculate how much the customer has already paid for the cycle
        // and we create a credit for the difference
        // we don't worry about usage charges because those are calculated
        // in the invoice part and don't need proration
        const invoiceMachine = new InvoiceStateMachine({
          db: this.db,
          phaseMachine: this,
          logger: this.logger,
          analytics: this.analytics,
          invoice: paidInvoice,
          paymentProviderToken: decryptedKey,
        })

        const proratedInvoice = await invoiceMachine.transition("PRORATE_INVOICE", {
          now: payload.now,
          startAt: paidInvoice.cycleStartAt,
          invoiceId: paidInvoice.id,
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

      const invoiceMachine = new InvoiceStateMachine({
        db: this.db,
        phaseMachine: this,
        logger: this.logger,
        analytics: this.analytics,
        invoice: invoice,
        paymentProviderToken: decryptedKey,
      })

      // // collect the payment
      const payment = await invoiceMachine.transition("COLLECT_PAYMENT", {
        invoiceId: invoice.id,
        now: payload.now,
        autoFinalize: true,
      })

      if (payment.err) {
        return Err(payment.err)
      }
    }

    // set end date to the entitlements in the phase
    await this.setEntitlementsEndDate({
      endAt,
      phaseId: activePhase.id,
    })

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
      metadataPhase: {
        note,
        reason,
      },
      metadataSubscription: {
        note,
        reason,
      },
    })

    return Ok({
      status: finalState,
      phaseId: activePhase.id,
      subscriptionId: this.subscription.id,
    })
  }

  public async setEntitlementsEndDate({
    endAt,
    phaseId,
  }: {
    endAt: number
    phaseId: string
  }): Promise<void> {
    // get the items in the phase
    const items = await this.db.query.subscriptionItems.findMany({
      where: (e, { eq }) => eq(e.subscriptionPhaseId, phaseId),
    })

    // set the end date to the entitlements
    for (const item of items) {
      await this.db
        .update(customerEntitlements)
        .set({ endAt })
        .where(eq(customerEntitlements.id, item.id))
    }
  }

  // check if the subscription requires a payment method and if the customer has one
  // if the plan version does not require a payment method, we don't need to validate
  public async validateCustomerPaymentMethod({
    now,
  }: {
    now: number
  }): Promise<
    Result<
      {
        paymentMethodId: string
        requiredPaymentMethod: boolean
      },
      UnPriceSubscriptionError
    >
  > {
    const { err, val: phase } = this.getActivePhase({ now })

    if (err) {
      return Err(err)
    }

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

    const { err: paymentMethodErr, val: paymentMethodId } =
      await this.paymentProviderService.getDefaultPaymentMethodId()

    if (paymentMethodErr) {
      return Err(
        new UnPriceSubscriptionError({
          message: `Error getting default payment method: ${paymentMethodErr.message}`,
        })
      )
    }

    if (
      requiredPaymentMethod &&
      (!paymentMethodId.paymentMethodId || paymentMethodId.paymentMethodId === "")
    ) {
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
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { now, isCancel = false } = payload

    const subscription = this.getSubscription()
    const { err, val: activePhase } = this.getActivePhase({ now })

    if (err) {
      return Err(err)
    }

    if (!activePhase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    // state of the subscription can change and this gave us the current state of the machine
    const currentState = this.getCurrentState()

    // check if the phase is active
    if (!activePhase.active || !["trial_ended", "active"].includes(currentState)) {
      return Err(
        new UnPriceSubscriptionError({ message: "Phase is not active or not ready to invoice" })
      )
    }

    // if the subscription is not ready to be invoiced we send an err
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt >= now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is not ready to be invoiced" })
      )
    }

    // check when was the last invoice for the subscription
    if (subscription.lastInvoiceAt && subscription.nextInvoiceAt <= subscription.lastInvoiceAt) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription has already been invoiced" })
      )
    }

    // get the pening invoice for the given date
    const pendingInvoice = await this.getPhaseInvoiceByStatus({
      phaseId: activePhase.id,
      startAt: subscription.currentCycleStartAt,
      status: "open",
    })

    let invoiceId = newId("invoice")

    if (pendingInvoice?.id) {
      invoiceId = pendingInvoice.id as `inv_${string}`
    }

    // validate if the customer has a payment method and if the plan version requires it
    const paymentValidation = await this.validateCustomerPaymentMethod({
      now,
    })

    if (paymentValidation.err) {
      return Err(paymentValidation.err)
    }

    // TODO: review this logic with more time
    // pay_in_advance =  invoice flat charges for the current cycle + usage from the previous cycle if any
    // pay_in_arrear = invoice usage + flat charges for the current cycle
    // isCancel = true means the phase is being canceled, we need to invoice the current cycle differently
    // - pay_in_advance = the invoice was already paid or created, we need to calculate pro ratio for flat charges if any
    // + the usage charges from the current cycle
    // - pay_in_arrear = the invoice was not paid, we need to calculate the usage for the current cycle and add the flat charges pro rata

    // invoice type is always hybrid except if the phase is being canceled and the whenToBill is pay_in_advance
    // but if thre is an invoice pending (which means not paid yet) that mean the invoice Type is hybrid.
    const whenToBill = activePhase.whenToBill
    // invoice type is super important because based on it we know how to calculate the invoice total
    let invoiceType = isCancel && whenToBill === "pay_in_advance" ? "usage" : "hybrid"

    if (pendingInvoice) {
      invoiceType = "hybrid"
    }

    // don't charge usage records that were created in the trial period
    if (activePhase.status === "trial_ended" && whenToBill === "pay_in_advance") {
      invoiceType = "flat"
    }

    const planVersion = activePhase.planVersion
    const { requiredPaymentMethod } = paymentValidation.val
    const collectionMethod = activePhase.collectionMethod

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
    const pastDueAt = addDays(dueAt, activePhase.gracePeriod).getTime()

    // create the invoice, if there is a pending invoice we will use it, otherwise we will create a new one
    const invoice = await this.db
      .insert(invoices)
      .values({
        id: invoiceId,
        subscriptionId: subscription.id,
        subscriptionPhaseId: activePhase.id,
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

    return Ok({
      invoice,
    })
  }
}
