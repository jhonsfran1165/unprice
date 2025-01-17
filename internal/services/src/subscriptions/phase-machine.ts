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
  type InvoiceMetadata,
  type InvoiceType,
  type PhaseStatus,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionMetadata,
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
    payload: {
      now: number
      cancelAt?: number
      metadataPhase?: SubscriptionPhaseMetadata
      metadataSubscription?: SubscriptionMetadata
    }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  EXPIRE: {
    payload: {
      now: number
      expiresAt?: number
      metadataPhase?: SubscriptionPhaseMetadata
      metadataSubscription?: SubscriptionMetadata
    }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  PAST_DUE: {
    payload: {
      now: number
      pastDueAt?: number
      metadataPhase?: SubscriptionPhaseMetadata
      metadataSubscription?: SubscriptionMetadata
    }
    result: { status: S; pastDueAt: number; subscriptionId: string; phaseId: string }
    error: UnPriceSubscriptionError
  }
  CHANGE: {
    payload: {
      now: number
      changeAt?: number
      metadataPhase?: SubscriptionPhaseMetadata
      metadataSubscription?: SubscriptionMetadata
    }
    result: { status: S; changedAt: number }
    error: UnPriceSubscriptionError
  }
  RENEW: {
    payload: {
      now: number
    }
    result: { status: S }
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
    const isFinalState = ["canceled", "expired", "changed", "past_dued"].includes(phase.status)
    super(phase.status, isFinalState)

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

    /*
     * END_TRIAL
     * set new status for the subscription and phase and renew the subscription so it can be invoiced
     */
    this.addTransition({
      from: ["trialing", "trial_ended"],
      to: ["trial_ended", "active"],
      event: "END_TRIAL",
      onTransition: async (payload) => {
        const phase = this.getPhase()
        const trialEndsAt = phase.trialEndsAt

        if (!trialEndsAt) {
          return Err(new UnPriceSubscriptionError({ message: "Trial end date is not set" }))
        }

        // check if the trial has ended if not don't do anything
        if (trialEndsAt && trialEndsAt >= payload.now) {
          return Err(new UnPriceSubscriptionError({ message: "Trial has not ended yet" }))
        }

        // validate the payment method
        const validatePaymentMethod = await this.validateCustomerPaymentMethod()

        if (validatePaymentMethod.err) {
          return Err(validatePaymentMethod.err)
        }

        // when ending the trial we need to update the subscription
        // calculate next billing cycle
        const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
          currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
          billingCycleStart: phase.startCycle, // start day of the billing cycle
          billingPeriod: phase.planVersion.billingPeriod, // billing period
          endAt: phase.endAt ?? undefined, // end day of the billing cycle if any
        })

        const nextInvoiceAt =
          phase.whenToBill === "pay_in_advance" ? cycleStart.getTime() + 1 : cycleEnd.getTime() + 1

        // for phases that are billed in arrear, we don't do anything more
        // but we already validate the payment method so we are kind of sure the payment will be collected
        if (phase.whenToBill === "pay_in_arrear") {
          // if the subscription is renewed, we set the state to active
          return await this.syncState({
            state: "active",
            subscriptionData: {
              nextInvoiceAt,
              currentCycleEndAt: cycleEnd.getTime(),
              currentCycleStartAt: cycleStart.getTime(),
              previousCycleEndAt: subscription.currentCycleEndAt,
              previousCycleStartAt: subscription.currentCycleStartAt,
            },
          })
        }

        // update the subscription
        return await this.syncState({
          state: "trial_ended",
          subscriptionData: {
            nextInvoiceAt,
            currentCycleEndAt: cycleEnd.getTime(),
            currentCycleStartAt: cycleStart.getTime(),
            previousCycleEndAt: subscription.currentCycleEndAt,
            previousCycleStartAt: subscription.currentCycleStartAt,
          },
          metadataSubscription: {
            reason: "trial_ended",
            note: "Trial ended pending invoice",
          },
          metadataPhase: {
            renew: {
              reason: "trial_ended",
              note: "Trial ended pending invoice",
            },
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
        const phase = this.getPhase()

        // invoice can be created any time in the cycle
        // but only will be due at the end or start of the cycle
        const invoice = await this.invoicingPhase({
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        return Ok({
          invoice: invoice.val.invoice,
          status: phase.status,
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
        const phase = this.getPhase()

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
          state: "active",
          active: true,
          subscriptionData: {
            pastDueAt: undefined,
            pastDuedAt: undefined,
          },
          metadataPhase: {
            pastDue: {
              reason: "payment_received",
              note: "Payment received",
              invoiceId: invoice.id,
            },
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
        const phase = this.getPhase()

        const renewPhase = await this.renewPhase({
          now: payload.now,
        })

        if (renewPhase.err) {
          return Err(renewPhase.err)
        }

        return Ok({
          status: phase.status,
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
        const phase = this.getPhase()

        const endPhaseResult = await this.cancelPhase({
          cancelAt, // end date of the phase is the date
          now: payload.now,
          metadataPhase: payload.metadataPhase,
          metadataSubscription: payload.metadataSubscription,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        return Ok({
          status: phase.status,
          phaseId: phase.id,
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
        // if no change at is provided, we change at the end of the current cycle
        const changeAt = payload.changeAt ?? subscription.currentCycleEndAt

        // changing a subscription mean creating a new phase
        // the creation of the new phase can happens outside the machine
        // It's just a new phase that is created.
        // this way the machine only takes care of the active phase
        // and we don't overcomplicate it handling multiple phases on this class
        const endPhaseResult = await this.changePhase({
          changeAt, // end date of the phase is the date
          now: payload.now,
          metadataPhase: payload.metadataPhase,
          metadataSubscription: payload.metadataSubscription,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
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
        const phase = this.getPhase()
        const subscription = this.getSubscription()

        // if the phase is not auto renewing we need to expire the phase
        const expiresAt = payload.expiresAt ?? subscription.currentCycleEndAt

        // end the phase
        const endPhaseResult = await this.expirePhase({
          expireAt: expiresAt, // end date of the phase is the date
          now: payload.now,
          metadataPhase: payload.metadataPhase,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
          phaseId: phase.id,
          subscriptionId: this.subscription.id,
        })
      },
    })

    /*
     * PAST_DUE
     * Apply past due to the subscription, this is triggerd by the invoice machine
     */
    this.addTransition({
      from: ["active"],
      to: ["past_dued"],
      event: "PAST_DUE",
      onTransition: async (payload) => {
        // get active phase
        const phase = this.getPhase()
        const subscription = this.getSubscription()

        const pastDueAt = payload.pastDueAt ?? subscription.currentCycleEndAt

        // end the phase
        const endPhaseResult = await this.pastDuePhase({
          pastDueAt, // end date of the phase is the date
          now: payload.now,
          metadataPhase: payload.metadataPhase,
          metadataSubscription: payload.metadataSubscription,
        })

        if (endPhaseResult.err) {
          return Err(endPhaseResult.err)
        }

        // if there is no invoice we just return the subscription state
        return Ok({
          status: endPhaseResult.val.status,
          phaseId: phase.id,
          pastDueAt: pastDueAt,
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
   * into the current phase property. This allows updating the phase data without
   * breaking the reference to the original phase object.
   *
   * Note: Properties that exist in phase but not in the provided phase will be preserved.
   * Object.assign() only overwrites properties that exist in the source object.
   *
   * @param phase - The new subscription phase data to merge into the current phase
   */
  private setPhase(phase: SubscriptionPhaseExtended): void {
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

  public getPhase(): SubscriptionPhaseExtended {
    return this.phase
  }

  public getSubscription(): Subscription {
    return this.subscription
  }

  private async syncState({
    state,
    active = true,
    subscriptionData,
    metadataSubscription,
    phaseData,
    metadataPhase,
  }: {
    state?: PhaseStatus
    active?: boolean
    subscriptionData?: Partial<{
      previousCycleStartAt: number
      previousCycleEndAt: number
      currentCycleStartAt: number
      currentCycleEndAt: number
      nextInvoiceAt: number
      lastInvoiceAt: number
      pastDueAt: number
      pastDuedAt: number
      cancelAt: number
      canceledAt: number
      changeAt: number
      changedAt: number
      expiresAt: number
      expiredAt: number
      renewAt: number
      lastRenewAt: number
    }>
    phaseData?: Partial<{
      startAt: number
      endAt: number
      autoRenew: boolean
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
    const phase = this.phase
    const subscription = this.subscription

    const isCanceled = ["canceled"].includes(state ?? phase.status)

    try {
      return await this.db.transaction(async (tx) => {
        // update the subscription status
        const subscriptionUpdated = await tx
          .update(subscriptions)
          .set({
            // deactivate the subscription if it's canceled only
            active: !isCanceled,
            ...(subscriptionData ? subscriptionData : undefined),
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
            status: state ?? phase.status,
            active: active ?? phase.active,
            ...(phaseData ? phaseData : undefined),
            ...(metadataPhase
              ? {
                  metadata: metadataPhase,
                }
              : undefined),
          })
          .where(
            and(
              eq(subscriptionPhases.subscriptionId, this.subscription.id),
              eq(subscriptionPhases.id, phase.id)
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
              ...(subscriptionData ? subscriptionData : undefined),
              ...(metadataSubscription
                ? {
                    metadata: metadataSubscription,
                  }
                : undefined),
            },
          })

          Object.assign(phaseUpdated ?? {}, {
            ...phase,
            ...{
              status: state ?? phase.status,
              active: active ?? phase.active,
              ...(phaseData ? phaseData : undefined),
              ...(metadataPhase
                ? {
                    metadata: metadataPhase,
                  }
                : undefined),
            },
          })
        }

        // sync the active phase and subscription with the new values
        phaseUpdated &&
          this.setPhase({
            ...phase,
            ...phaseUpdated,
          })
        subscriptionUpdated && this.setSubscription(subscriptionUpdated)

        return Ok({
          subscriptionId: subscription.id,
          phaseId: phase.id,
          status: phase.status,
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

  public async getInvoicePhase({
    phaseId,
    startAt,
    endAt,
    status,
  }: {
    phaseId: string
    startAt: number
    endAt?: number
    status: "paid" | "open" | "failed" | "all"
  }): Promise<SubscriptionInvoice | undefined> {
    const pendingInvoice = await this.db.query.invoices.findFirst({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionPhaseId, phaseId),
          // we purposelly use the startAt from the subscription to get the invoice
          // because the end can change so we want to get the invoice for the current cycle
          eq(table.cycleStartAt, startAt),
          // don't include the invoice if it's prorated
          eq(table.prorated, false),
          endAt ? eq(table.cycleEndAt, endAt) : undefined,
          status === "open"
            ? inArray(table.status, ["draft", "unpaid"])
            : status === "failed"
              ? inArray(table.status, ["failed"])
              : status === "all"
                ? inArray(table.status, ["paid", "void", "draft", "unpaid", "failed"])
                : inArray(table.status, ["paid", "void"])
        ),
      orderBy: (table, { asc }) => [asc(table.cycleEndAt)],
    })

    return pendingInvoice
  }

  private async renewPhase({
    now,
  }: {
    now: number
  }): Promise<Result<void, UnPriceSubscriptionError>> {
    const subscription = this.getSubscription()
    const phase = this.getPhase()
    const alreadyInvoiced =
      subscription.lastInvoiceAt && subscription.lastInvoiceAt >= subscription.nextInvoiceAt
    const alreadyRenewed =
      subscription.lastRenewAt && subscription.lastRenewAt >= subscription.renewAt

    // subscription needs to be invoiced before renewing
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt < subscription.renewAt) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has not been invoiced. Invoice the current cycle first",
        })
      )
    }

    // check when the subscription should be renewed
    if (subscription.renewAt > now) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is not due for renewal yet",
        })
      )
    }

    // subscription can only be renewed if they are active or trialing
    if (phase.status !== "active") {
      return Err(new UnPriceSubscriptionError({ message: "Subscription is not active" }))
    }

    // do not renew if there is a change, cancel, expire or past due scheduled
    if (
      subscription.changeAt ||
      subscription.cancelAt ||
      subscription.expiresAt ||
      subscription.pastDueAt
    ) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has a change, cancel, expire or past due scheduled, cannot renew",
        })
      )
    }

    // we cannot renew if the subscription has not been invoiced
    if (!alreadyInvoiced) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has not been invoiced, invoice the current cycle first",
        })
      )
    }

    // if already renewed we just return
    if (alreadyRenewed) {
      return Ok(undefined)
    }

    // if the phase is not auto renewing we need to expire the phase
    if (!phase.autoRenew) {
      const result = await this.expirePhase({
        now,
        expireAt: subscription.currentCycleEndAt,
        metadataPhase: {
          expire: {
            reason: "auto_renew_disabled",
            note: "Phase is not auto renewing, setting the end date to the current cycle end date",
          },
        },
        metadataSubscription: {
          reason: "auto_renew_disabled",
          note: "Phase is not auto renewing, setting the end date to the current cycle end date",
        },
      })

      if (result.err) {
        return Err(result.err)
      }

      return Ok(undefined)
    }

    // calculate next billing cycle
    // here we calculate the next billing cycle, in order to do that we add a millisecond to the current cycle end date example:
    // if the current cycle end date is 2023-12-31T23:59:59Z we add a millisecond to get 2024-01-01T00:00:00.000Z
    // so we keep continuity with the current cycle
    const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
      currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping with the current cycle
      billingCycleStart: phase.startCycle, // start day of the billing cycle
      billingPeriod: phase.planVersion.billingPeriod, // billing period
      endAt: phase.endAt ?? undefined, // end day of the billing cycle if any
    })

    // TODO: this is not working as expected, we need to fix it
    // we need to design this in a way that we can invoice multiple times without creating a new invoice
    // also if renew fails we need to be able to rollback the changes
    // Check if the calculated cycle end is after any scheduled change, cancel or expiry dates
    if (
      subscription.changeAt ||
      subscription.cancelAt ||
      subscription.expiresAt ||
      subscription.pastDueAt
    ) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription cannot be renewed, it's scheduled to end.",
        })
      )
    }

    const nextInvoiceAt =
      phase.whenToBill === "pay_in_advance" ? cycleStart.getTime() + 1 : cycleEnd.getTime() + 1

    // renewing a phase implies setting the new cycle for the subscription
    const syncStateResult = await this.syncState({
      state: "active",
      active: true,
      subscriptionData: {
        previousCycleStartAt: subscription.currentCycleStartAt,
        previousCycleEndAt: subscription.currentCycleEndAt,
        currentCycleStartAt: cycleStart.getTime(),
        currentCycleEndAt: cycleEnd.getTime(),
        // renew at is the next invoice at + 1 millisecond this is because we invoice first and then renew
        renewAt: nextInvoiceAt + 1,
        lastRenewAt: Date.now(),
      },
    })

    if (syncStateResult.err) {
      return Err(syncStateResult.err)
    }

    return Ok(undefined)
  }

  private validateEndDates(endAt: number, now: number): Result<void, UnPriceSubscriptionError> {
    const subscription = this.getSubscription()
    const phase = this.getPhase()

    // if subsciption is already inactive return an error
    if (!subscription.active) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is already inactive",
        })
      )
    }

    // for cancelations on trailing the cancel date is the end of the trial
    if (phase.status === "trialing" && endAt !== phase.trialEndsAt) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "This subscription phase is in trial, the cancelation date has to be the same as the end of the trial",
        })
      )
    }

    // cannot cancel a phase if the subscription is changing
    if (subscription.changeAt && subscription.changeAt > now) {
      // this is idempotent so if the change is already applied it won't do anything
      if (subscription.changeAt === endAt) {
        return Ok(undefined)
      }

      return Err(
        new UnPriceSubscriptionError({
          message: "The subscription is changing, wait for the change to be applied",
        })
      )
    }

    // we cannot cancel a subscription that is expiring
    if (subscription.expiresAt && subscription.expiresAt > now) {
      // this is idempotent so if the change is already applied it won't do anything
      if (subscription.expiresAt === endAt) {
        return Ok(undefined)
      }

      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is expiring, wait for it to expire" })
      )
    }

    // we cannot cancel a subscription that is already canceling
    if (subscription.cancelAt && subscription.cancelAt > now) {
      // this is idempotent so if the change is already applied it won't do anything
      if (subscription.cancelAt === endAt) {
        return Ok(undefined)
      }

      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription is already canceling, wait for it to be canceled",
        })
      )
    }

    return Ok(undefined)
  }

  // when canceling a phase we cancel the phase and the subscription
  private async cancelPhase(payload: {
    cancelAt: number
    now: number
    metadataPhase?: SubscriptionPhaseMetadata
    metadataSubscription?: SubscriptionMetadata
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
    const { cancelAt, now } = payload
    // get active phase
    const phase = this.getPhase()

    const subscription = this.getSubscription()

    const metadataPhase = {
      cancel: {
        reason: "pending_cancellation",
        note: "Phase is being canceled, waiting for invoice and payment",
        ...payload.metadataPhase?.cancel,
      },
    } as SubscriptionPhaseMetadata

    const metadataSubscription = {
      reason: "pending_cancellation",
      note: "Phase is being canceled, waiting for invoice and payment",
      ...payload.metadataSubscription,
    } as SubscriptionMetadata

    if (!metadataPhase?.cancel) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Cancel metadata is required",
        })
      )
    }

    // validate the end date
    const validateEndDatesResult = this.validateEndDates(cancelAt, now)

    if (validateEndDatesResult.err) {
      return Err(validateEndDatesResult.err)
    }

    // set end date to the entitlements in the phase
    await this.setEntitlementsEndDate({
      endAt: cancelAt,
      phaseId: phase.id,
    })

    // we set the dates and the next invoice at the end date
    // so next time we call the machine we will know what to do
    await this.syncState({
      subscriptionData: {
        cancelAt: cancelAt,
      },
      phaseData: {
        endAt: cancelAt,
      },
      metadataPhase: metadataPhase,
      metadataSubscription: metadataSubscription,
    })

    // if subscription is not ready to be canceled, send an error
    // before applying the end date we need to sync the state
    if (cancelAt > now) {
      // if all goes well we return the phase status
      // the cancellation, change or expiration will be handled in by background jobs
      return Ok({
        status: phase.status,
        phaseId: phase.id,
        subscriptionId: subscription.id,
      })
    }

    // first thing is to invoice the current cycle
    const invoiceResult = await this.invoicingPhase({
      now,
      endAt: cancelAt,
    })

    if (invoiceResult.err) {
      return Err(invoiceResult.err)
    }

    const configPaymentProvider = await this.db.query.paymentProviderConfig.findFirst({
      where: (config, { and, eq }) =>
        and(
          eq(config.projectId, phase.projectId),
          eq(config.paymentProvider, phase.planVersion.paymentProvider),
          eq(config.active, true)
        ),
    })

    if (!configPaymentProvider) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Payment provider config not found or not active",
        })
      )
    }

    const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

    const decryptedKey = await aesGCM.decrypt({
      iv: configPaymentProvider.keyIv,
      ciphertext: configPaymentProvider.key,
    })

    const invoice = invoiceResult.val.invoice

    const invoiceMachine = new InvoiceStateMachine({
      db: this.db,
      phaseMachine: this,
      logger: this.logger,
      analytics: this.analytics,
      invoice: invoice,
      paymentProviderToken: decryptedKey,
    })

    // these 3 are the final states of the invoice machine
    if (!["paid", "void", "failed"].includes(invoice.status)) {
      // collect the payment or retry the payment
      const payment = await invoiceMachine.transition("COLLECT_PAYMENT", {
        invoiceId: invoice.id,
        now: payload.now,
        autoFinalize: true,
      })

      if (payment.err) {
        return Err(payment.err)
      }
    }

    // after paying the invoice, we need to check if there are any open invoices
    // if there are, it means the customer still owes money and we cannot cancel the phase
    const invoiceData = await this.getInvoicePhase({
      phaseId: phase.id,
      startAt: subscription.currentCycleStartAt,
      status: "open",
    })

    if (invoiceData) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Subscription has open invoices, cannot cancel. Please pay the invoice first.",
        })
      )
    }

    // update the subscription dates and deactivate the subscription
    await this.syncState({
      state: "canceled",
      // set the subscription to inactive when applying the end dates
      active: false,
      subscriptionData: {
        canceledAt: cancelAt,
        // clear the other dates
        cancelAt: undefined,
        changeAt: undefined,
        expiresAt: undefined,
        pastDueAt: undefined,
      },
    })

    return Ok({
      status: "canceled",
      phaseId: phase.id,
      subscriptionId: this.subscription.id,
    })
  }

  // when changing a phase we invoice and then deactivate the phase
  private async changePhase(payload: {
    changeAt: number
    now: number
    metadataPhase?: SubscriptionPhaseMetadata
    metadataSubscription?: SubscriptionMetadata
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
    const { changeAt, now } = payload
    // get active phase
    const phase = this.getPhase()

    const subscription = this.getSubscription()

    const metadataPhase = {
      change: {
        reason: "pending_change",
        note: "Phase is being changed, waiting for invoice and payment",
        ...payload.metadataPhase?.change,
      },
    } as SubscriptionPhaseMetadata

    const metadataSubscription = {
      reason: "pending_change",
      note: "Phase is being changed, waiting for invoice and payment",
      ...payload.metadataSubscription,
    } as SubscriptionMetadata

    if (!metadataPhase?.change) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Change metadata is required",
        })
      )
    }

    // we cannot change the plan if the customer changed the plan in the past 30 days
    if (subscription?.changedAt && subscription.changedAt > now - 30 * 1000 * 60 * 60 * 24) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "You already changed the plan in the past 30 days, can't change again until 30 days have passed",
        })
      )
    }

    // validate the end date
    const validateEndDatesResult = this.validateEndDates(changeAt, now)

    if (validateEndDatesResult.err) {
      return Err(validateEndDatesResult.err)
    }

    // set end date to the entitlements in the phase
    await this.setEntitlementsEndDate({
      endAt: changeAt,
      phaseId: phase.id,
    })

    // we set the dates and the next invoice at the end date
    // so next time we call the machine we will know what to do
    await this.syncState({
      subscriptionData: {
        changeAt: changeAt,
      },
      phaseData: {
        endAt: changeAt,
      },
      metadataPhase: metadataPhase,
      metadataSubscription: metadataSubscription,
    })

    // if subscription is not ready to be canceled, send an error
    // before applying the end date we need to sync the state
    if (changeAt > now) {
      // if all goes well we return the phase status
      // the cancellation, change or expiration will be handled in by background jobs
      return Ok({
        status: phase.status,
        phaseId: phase.id,
        subscriptionId: subscription.id,
      })
    }

    // first thing is to invoice the current cycle
    const invoiceResult = await this.invoicingPhase({
      now,
      endAt: changeAt,
    })

    if (invoiceResult.err) {
      return Err(invoiceResult.err)
    }

    // update the subscription dates and deactivate the subscription
    await this.syncState({
      state: "changed",
      // set the subscription to inactive when applying the end dates
      active: false,
      subscriptionData: {
        changedAt: changeAt,
        // clear the other dates
        cancelAt: undefined,
        changeAt: undefined,
        expiresAt: undefined,
        pastDueAt: undefined,
      },
    })

    return Ok({
      status: "changed",
      phaseId: phase.id,
      subscriptionId: this.subscription.id,
    })
  }

  private async expirePhase(payload: {
    expireAt: number
    now: number
    metadataPhase?: SubscriptionPhaseMetadata
    metadataSubscription?: SubscriptionMetadata
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
    const { expireAt, now } = payload

    const phase = this.getPhase()
    const subscription = this.getSubscription()

    const metadataPhase = {
      expire: {
        reason: "pending_expiration",
        note: "Phase is expiring, waiting for invoice and payment",
        ...payload.metadataPhase?.expire,
      },
    } as SubscriptionPhaseMetadata

    const metadataSubscription = {
      reason: "pending_expiration",
      note: "Phase is expiring, waiting for invoice and payment",
      ...payload.metadataSubscription,
    } as SubscriptionMetadata

    if (!metadataPhase?.expire) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Expire metadata is required",
        })
      )
    }

    // validate the end date
    const validateEndDatesResult = this.validateEndDates(expireAt, now)

    if (validateEndDatesResult.err) {
      return Err(validateEndDatesResult.err)
    }

    // set end date to the entitlements in the phase
    await this.setEntitlementsEndDate({
      endAt: expireAt,
      phaseId: phase.id,
    })

    // we set the dates and the next invoice at the end date
    // so next time we call the machine we will know what to do
    await this.syncState({
      subscriptionData: {
        expiresAt: expireAt,
      },
      phaseData: {
        endAt: expireAt,
        autoRenew: false,
      },
      metadataPhase: metadataPhase,
      metadataSubscription: metadataSubscription,
    })

    // if subscription is not ready to be canceled, send an error
    // before applying the end date we need to sync the state
    if (expireAt > now) {
      // if all goes well we return the phase status
      // the cancellation, change or expiration will be handled in by background jobs
      return Ok({
        status: phase.status,
        phaseId: phase.id,
        subscriptionId: subscription.id,
      })
    }

    // if the phase is auto renew and there is a request to expire the phase
    // we need to send an error
    if (phase.autoRenew) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "Phase is auto renewing, cannot expire. Set auto renew to false to expire the phase",
        })
      )
    }

    // first thing is to invoice the current cycle
    const invoiceResult = await this.invoicingPhase({
      now,
      endAt: expireAt,
    })

    if (invoiceResult.err) {
      return Err(invoiceResult.err)
    }

    // update the subscription dates and deactivate the subscription
    await this.syncState({
      state: "expired",
      // set the subscription to inactive when applying the end dates
      active: false,
      subscriptionData: {
        expiredAt: expireAt,
        // clear the other dates
        cancelAt: undefined,
        changeAt: undefined,
        expiresAt: undefined,
        pastDueAt: undefined,
      },
    })

    return Ok({
      status: "expired",
      phaseId: phase.id,
      subscriptionId: this.subscription.id,
    })
  }

  private async pastDuePhase(payload: {
    pastDueAt: number
    now: number
    metadataPhase?: SubscriptionPhaseMetadata
    metadataSubscription?: SubscriptionMetadata
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
    const { pastDueAt, now } = payload

    const phase = this.getPhase()
    const subscription = this.getSubscription()

    const metadataPhase = {
      pastDue: {
        reason: "invoice_failed",
        note: "Invoice in past due, waiting for payment",
        ...payload.metadataPhase?.pastDue,
      },
    } as SubscriptionPhaseMetadata

    const metadataSubscription = {
      reason: "invoice_failed",
      note: "Invoice in past due, waiting for payment",
      ...payload.metadataSubscription,
    } as SubscriptionMetadata

    if (!metadataPhase?.pastDue) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Past due metadata is required",
        })
      )
    }

    // validate the end date
    const validateEndDatesResult = this.validateEndDates(pastDueAt, now)

    if (validateEndDatesResult.err) {
      return Err(validateEndDatesResult.err)
    }

    // set end date to the entitlements in the phase
    await this.setEntitlementsEndDate({
      endAt: pastDueAt,
      phaseId: phase.id,
    })

    // we set the dates and the next invoice at the end date
    // so next time we call the machine we will know what to do
    await this.syncState({
      subscriptionData: {
        pastDueAt: pastDueAt,
      },
      phaseData: {
        endAt: pastDueAt,
        autoRenew: false,
      },
      metadataPhase: metadataPhase,
      metadataSubscription: metadataSubscription,
    })

    // if subscription is not ready to be canceled, send an error
    // before applying the end date we need to sync the state
    if (pastDueAt > now) {
      // if all goes well we return the phase status
      // the cancellation, change or expiration will be handled in by background jobs
      return Ok({
        status: phase.status,
        phaseId: phase.id,
        subscriptionId: subscription.id,
      })
    }

    const invoiceId = metadataPhase?.pastDue?.invoiceId

    if (!invoiceId) {
      return Err(
        new UnPriceSubscriptionError({
          message: "The invoice id that is triggering the past due is required",
        })
      )
    }

    // when past due it means there is an invoice that failed to be paid
    // let's check if the invoice is paid or voided before ending the phase
    const invoice = await this.db.query.invoices.findFirst({
      where: (inv, { eq, and }) =>
        and(eq(inv.id, invoiceId), eq(inv.subscriptionPhaseId, phase.id)),
    })

    if (!invoice) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice not found",
        })
      )
    }

    if (["paid", "void"].includes(invoice.status)) {
      // validate if the invoice is already paid or voided
      // if it is, we need to send an error
      return Err(
        new UnPriceSubscriptionError({
          message: "Invoice is already paid or voided",
        })
      )
    }

    // update the subscription dates and deactivate the subscription
    await this.syncState({
      state: "past_dued",
      // set the subscription to inactive when applying the end dates
      active: false,
      subscriptionData: {
        pastDuedAt: pastDueAt,
        // clear the other dates
        cancelAt: undefined,
        changeAt: undefined,
        expiresAt: undefined,
        pastDueAt: undefined,
      },
    })

    return Ok({
      status: "past_dued",
      phaseId: phase.id,
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
        .where(eq(customerEntitlements.subscriptionItemId, item.id))
    }
  }

  // check if the subscription requires a payment method and if the customer has one
  // if the plan version does not require a payment method, we don't need to validate
  public async validateCustomerPaymentMethod(): Promise<
    Result<
      {
        paymentMethodId: string
        requiredPaymentMethod: boolean
      },
      UnPriceSubscriptionError
    >
  > {
    const phase = this.getPhase()

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

  // This method create an invoice for the current cycle
  // it creates a new invoice if there is no invoice for the current cycle
  // it updates the invoice if there is an invoice for the current cycle
  private async invoicingPhase(payload: {
    now: number
    endAt?: number
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { now, endAt } = payload

    const subscription = this.getSubscription()
    const phase = this.getPhase()

    const isEnding = endAt !== undefined
    const isTrialEnding = phase.status === "trial_ended"
    const alreadyInvoiced =
      subscription.lastInvoiceAt && subscription.lastInvoiceAt >= subscription.nextInvoiceAt

    // the machine can change its state between the declaration of the machine and the execution of the method
    // so we need to get the current state of the machine
    const currentState = this.getCurrentState()

    // check if the phase is active
    if (!phase.active || !["trial_ended", "active"].includes(currentState)) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Phase can't be invoiced, it's not active or not in trial ended",
        })
      )
    }

    // if the subscription is not ready to be invoiced we send an err
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
      return Err(
        new UnPriceSubscriptionError({ message: "Subscription is not ready to be invoiced" })
      )
    }

    // if endAt is not in the current cycle we send an error
    if (
      isEnding &&
      (endAt < subscription.currentCycleStartAt || endAt > subscription.currentCycleEndAt)
    ) {
      return Err(
        new UnPriceSubscriptionError({
          message:
            "End date is not in the current cycle, please provide a date in the current cycle",
        })
      )
    }

    // This allow us to invoice the same customer multiple times without creating a new invoice
    // get the pending invoice for the given date if any
    // we could have the case where there is a invoice open for the current cycle
    // but there is a cancelation or change before paying it
    // in that case we update the open invoice with the new cycle dates
    // it won't include the prorated invoices
    const invoiceCurrentCycle = await this.getInvoicePhase({
      phaseId: phase.id,
      startAt: subscription.currentCycleStartAt,
      // when ending we need to get all the invoices for the current cycle
      // otherwise we only get the open invoice
      status: isEnding ? "all" : "open",
    })

    // if there is an invoice for the current cycle we use it, otherwise we create a new one
    const invoiceId = invoiceCurrentCycle?.id
      ? (invoiceCurrentCycle.id as `inv_${string}`)
      : newId("invoice")

    // check if the phase was already invoiced and return the invoice
    // when is ending we need to update the invoice
    if (!isEnding && alreadyInvoiced) {
      if (!invoiceCurrentCycle) {
        return Err(
          new UnPriceSubscriptionError({
            message: "Subscription has already been invoiced but no invoice found",
          })
        )
      }

      return Ok({
        invoice: invoiceCurrentCycle,
      })
    }

    // validate if the customer has a payment method and if the plan version requires it
    const paymentValidation = await this.validateCustomerPaymentMethod()

    if (paymentValidation.err) {
      return Err(paymentValidation.err)
    }

    // always hybrid, but if the phase is ending
    let invoiceType = "hybrid"
    const invoiceStartAt = subscription.currentCycleStartAt
    let invoiceEndAt = subscription.currentCycleEndAt

    const metadata = {
      note: `Invoice for the ${subscription.planSlug} subscription`,
      reason: "renewed",
      ...(invoiceCurrentCycle?.metadata || {}),
    } as InvoiceMetadata

    // pay_in_advance =  invoice flat charges for the current cycle + usage from the previous cycle if any
    // pay_in_arrear = invoice usage + flat charges for the current cycle
    const whenToBill = phase.whenToBill
    const collectionMethod = phase.collectionMethod
    const planVersion = phase.planVersion
    const { requiredPaymentMethod } = paymentValidation.val

    // ending is treated differently depending on the whenToBill
    if (isEnding) {
      metadata.reason = "ending"
      metadata.note = `Invoice for the ${subscription.planSlug} subscription (ending at ${endAt})`

      if (invoiceCurrentCycle) {
        // for pay in advance
        if (whenToBill === "pay_in_advance") {
          // if already paid or voided, we need to prorate the invoice
          if (["paid", "void"].includes(invoiceCurrentCycle.status)) {
            const configPaymentProvider = await this.db.query.paymentProviderConfig.findFirst({
              where: (config, { and, eq }) =>
                and(
                  eq(config.projectId, phase.projectId),
                  eq(config.paymentProvider, phase.planVersion.paymentProvider),
                  eq(config.active, true)
                ),
            })

            if (!configPaymentProvider) {
              return Err(
                new UnPriceSubscriptionError({
                  message: "Payment provider config not found or not active",
                })
              )
            }

            const aesGCM = await AesGCM.withBase64Key(env.ENCRYPTION_KEY)

            const decryptedKey = await aesGCM.decrypt({
              iv: configPaymentProvider.keyIv,
              ciphertext: configPaymentProvider.key,
            })

            // prorate flat charges
            const invoiceMachine = new InvoiceStateMachine({
              db: this.db,
              phaseMachine: this,
              logger: this.logger,
              analytics: this.analytics,
              invoice: invoiceCurrentCycle,
              paymentProviderToken: decryptedKey,
            })

            // this will give us some credits from prorating the flat charges
            // usage will be calculated in the next invoice
            const proratedInvoice = await invoiceMachine.transition("PRORATE_INVOICE", {
              now: payload.now,
              startAt: invoiceCurrentCycle.cycleStartAt,
              invoiceId: invoiceCurrentCycle.id,
              endAt: endAt, // end date passed in the payload
            })

            if (proratedInvoice.err) {
              return Err(proratedInvoice.err)
            }

            // cover usage for the current cycle until the end date
            invoiceType = "usage"
            invoiceEndAt = endAt
          } else {
            // if not paid or voided, we need to update the invoice with the new end date
            invoiceEndAt = endAt
          }
        }
      }
    }

    // don't charge usage records that were created in the trial period
    if (isTrialEnding && whenToBill === "pay_in_advance") {
      // don't include usage from past cycles when the subscription is in trial
      invoiceType = "flat"
    }

    // calculate when to bill - if the subscription is pay in advance, the due date is the start of the cycle
    // if the subscription is pay in arrear, the due date is the end of the cycle
    let dueAt =
      whenToBill === "pay_in_advance"
        ? subscription.currentCycleStartAt + 1
        : subscription.currentCycleEndAt + 1

    // if is ending due date is always in the end of the cycle
    if (isEnding) {
      dueAt = endAt
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
        cycleStartAt: invoiceStartAt,
        cycleEndAt: invoiceEndAt,
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
        metadata,
      })
      .onConflictDoUpdate({
        target: [invoices.id, invoices.projectId],
        // if the invoice is pending, we update the cycle dates
        set: {
          type: invoiceType as InvoiceType,
          cycleStartAt: invoiceStartAt,
          cycleEndAt: invoiceEndAt,
          previousCycleStartAt: subscription.previousCycleStartAt,
          previousCycleEndAt: subscription.previousCycleEndAt,
          dueAt,
          pastDueAt,
          metadata,
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

    const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
      currentCycleStartAt: invoiceEndAt + 1, // add one millisecond to avoid overlapping
      billingCycleStart: phase.startCycle, // start day of the billing cycle
      billingPeriod: phase.planVersion.billingPeriod, // billing period
      endAt: endAt, // end day of the billing cycle if any
    })

    const nextInvoiceAt =
      whenToBill === "pay_in_advance" ? cycleStart.getTime() + 1 : cycleEnd.getTime() + 1

    // update subscription invoice information
    await this.syncState({
      subscriptionData: {
        lastInvoiceAt: now,
        nextInvoiceAt: nextInvoiceAt,
      },
    })

    return Ok({
      invoice,
    })
  }
}
