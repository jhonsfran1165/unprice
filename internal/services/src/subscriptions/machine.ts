import { type Database, type TransactionDatabase, and, eq } from "@unprice/db"
import { invoices, subscriptionPhases, subscriptions } from "@unprice/db/schema"
import { newId, toStripeMoney } from "@unprice/db/utils"
import {
  type CalculatedPrice,
  type Customer,
  type InvoiceStatus,
  type Subscription,
  type SubscriptionInvoice,
  type SubscriptionPhaseExtended,
  type SubscriptionStatus,
  calculatePricePerFeature,
  configureBillingCycleSubscription,
} from "@unprice/db/validators"
import { Err, Ok, type Result } from "@unprice/error"
import type { Logger } from "@unprice/logging"
import type { Analytics } from "@unprice/tinybird"
import { addDays } from "date-fns"
import { StateMachine } from "../machine/service"
import { StripePaymentProvider } from "../payment-provider/stripe"
import { UnPriceSubscriptionError } from "./errors"

export type SubscriptionEventMap<S extends string> = {
  END_TRIAL: {
    payload: { now: number }
    result: { subscriptionId: string; phaseId: string; status: S }
    error: UnPriceSubscriptionError
  }
  INVOICE: {
    payload: { now: number }
    result: { invoiceId: string; status: S }
    error: UnPriceSubscriptionError
  }
  COLLECT_PAYMENT: {
    payload: { invoiceId: string }
    result: { status: S; paymentStatus: InvoiceStatus; retries: number }
    error: UnPriceSubscriptionError
  }
  BILL: {
    payload: { now: number }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
  RENEW: {
    payload: { now: number }
    result: { status: S }
    error: UnPriceSubscriptionError
  }
  UPDATE: {
    payload: {
      status: S
      updatedAt: number
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
  private readonly subscriptionPhase: SubscriptionPhaseExtended
  private readonly subscription: Subscription
  private readonly customer: Customer
  private readonly db: Database | TransactionDatabase
  private readonly logger: Logger
  private readonly analytics: Analytics

  constructor({
    db,
    subscriptionPhase,
    subscription,
    customer,
    logger,
    analytics,
  }: {
    db: Database | TransactionDatabase
    subscriptionPhase: SubscriptionPhaseExtended
    subscription: Subscription
    customer: Customer
    logger: Logger
    analytics: Analytics
  }) {
    // initial state
    if (!subscriptionPhase.status) {
      throw new UnPriceSubscriptionError({ message: "Subscription phase has no status" })
    }

    super(subscriptionPhase.status)

    this.subscriptionPhase = subscriptionPhase
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
        if (!activePhase.active || activePhase.status !== "trialing") {
          return Err(
            new UnPriceSubscriptionError({ message: "Phase is not active or not trialing" })
          )
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
          subscriptionDates: {
            pastDueAt: undefined,
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
      onSuccess: async (result) => {
        console.log("Trial ended:", result)
        // await this.analytics.track({
        //   event: "subscription_trial_ended",
        //   data: {
        //     subscriptionId: this.subscription.id,
        //     phaseId: result.phaseId,
        //   },
        // })
      },
      onError: async (error) => {
        console.error("Error ending trial:", error)
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
        // validate dates
        // get the active phase - subscription only has one phase active at a time
        const activePhase = this.getActivePhase()
        const subscription = this.subscription

        if (!activePhase) {
          return Err(
            new UnPriceSubscriptionError({
              message: "No active phase found, for date",
              context: { date: payload.now },
            })
          )
        }

        // create an invoice for the subscription phase
        const invoice = await this.createInvoiceSubscriptionPhase({
          phaseId: activePhase.id,
          startAt: subscription.currentCycleStartAt,
          endAt: subscription.currentCycleEndAt,
          now: payload.now,
        })

        if (invoice.err) {
          return Err(invoice.err)
        }

        const dueAt = invoice.val.invoice.dueAt
        const pastDueAt = invoice.val.invoice.pastDueAt

        // if the invoice should be finalized, we do it immediately
        if (dueAt >= payload.now) {
          const result = await this.finalizeInvoice({
            invoice: invoice.val.invoice,
            now: payload.now,
          })

          if (result.err) {
            return Err(result.err)
          }

          // update state
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
      onSuccess: async (result) => {
        console.log("Subscription pending:", result)
        // await this.analytics.track({
        //   event: "subscription_pending",
        //   data: {
        //     subscriptionId: this.subscription.id,
        //     phaseId: result.phaseId,
        //   },
        // })
      },
      onError: async (error) => {
        console.error("Error creating invoice:", error)
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
        const invoice = await this.getInvoice(payload.invoiceId)

        if (!invoice) {
          return Err(new UnPriceSubscriptionError({ message: "Invoice not found" }))
        }

        const result = await this.collectInvoicePayment({
          invoice,
        })

        if (result.err) {
          return Err(result.err)
        }

        if (result.val.status === "paid") {
          // only update the state if the payment is successful
          await this.syncState({
            state: "active",
            phaseId: invoice.subscriptionPhaseId,
            active: true,
            subscriptionDates: {
              pastDueAt: undefined,
            },
          })

          // bill the invoice
          return Ok({
            status: "active",
            paymentStatus: result.val.status,
            retries: result.val.retries,
          })
        }

        // bill the invoice
        return Ok({
          status: "past_due",
          paymentStatus: result.val.status,
          retries: result.val.retries,
        })
      },
      onSuccess: async (result) => {
        console.log("Subscription billed:", result)
      },
      onError: async (error) => {
        console.error("Error billing subscription:", error)
      },
    })

    /*
     * RENEW
     * renew the phase, set the new cycle for the subscription
     */
    this.addTransition({
      from: ["active"],
      to: ["active"],
      event: "RENEW",
      onTransition: async (payload) => {
        // get active phase
        const activePhase = this.getActivePhase()
        const subscription = this.subscription
        const currentState = this.getCurrentState()

        if (!activePhase) {
          return Err(new UnPriceSubscriptionError({ message: "No active phase found" }))
        }

        // check if the phase is active
        if (currentState !== "active") {
          return Err(
            new UnPriceSubscriptionError({
              message: "Phase is not active, cannot renew phases that are not active",
            })
          )
        }

        // check if the subscription is not scheduled to be changed, expired or canceled
        if (subscription.changeAt && subscription.changeAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is scheduled to be changed" })
          )
        }

        if (subscription.cancelAt && subscription.cancelAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is scheduled to be canceled" })
          )
        }

        if (subscription.expiresAt && subscription.expiresAt > payload.now) {
          return Err(
            new UnPriceSubscriptionError({ message: "Subscription is scheduled to expire" })
          )
        }

        const autoRenew = activePhase.autoRenew

        if (!autoRenew) {
          return Err(new UnPriceSubscriptionError({ message: "Phase does not auto renew" }))
        }

        // check if the subscription was already renewed
        // check the new cycle start and end dates are between now
        if (
          payload.now >= subscription.currentCycleStartAt &&
          payload.now <= subscription.currentCycleEndAt
        ) {
          return Ok({
            status: "active",
          })
        }

        // calculate next billing cycle
        const { cycleStart, cycleEnd } = configureBillingCycleSubscription({
          currentCycleStartAt: subscription.currentCycleEndAt + 1,
          billingCycleStart: activePhase.startCycle,
          billingPeriod: activePhase.planVersion?.billingPeriod ?? "month",
          endAt: activePhase.endAt ?? undefined,
        })

        const whenToBill = activePhase.whenToBill

        // renewing a phase implies setting the new cycle for the subscription
        await this.syncState({
          state: "active",
          phaseId: activePhase.id,
          active: true,
          subscriptionDates: {
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
          status: "active",
        })
      },
    })
  }

  private async syncState({
    state,
    active = true,
    subscriptionDates,
    metadata,
  }: {
    state: SubscriptionStatus
    active: boolean
    phaseId: string
    subscriptionDates: Partial<{
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
    metadata?: Record<string, unknown>
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
            status: state,
            active,
            // update the subscription dates
            ...subscriptionDates,
            metadata,
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
            status: state,
            active,
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
    return this.subscriptionPhase
  }

  private async getInvoice(invoiceId: string): Promise<SubscriptionInvoice | undefined> {
    const invoice = await this.db.query.invoices.findFirst({
      where: (table, { eq }) => eq(table.id, invoiceId),
    })

    return invoice
  }

  private async getPendingPhaseInvoice(): Promise<SubscriptionInvoice | undefined> {
    const activePhase = this.getActivePhase()
    const subscription = this.subscription

    if (!activePhase) {
      return undefined
    }

    const pendingInvoice = await this.db.query.invoices.findFirst({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionId, subscription.id),
          eq(table.subscriptionPhaseId, activePhase.id),
          eq(table.cycleStartAt, subscription.currentCycleStartAt),
          eq(table.cycleEndAt, subscription.currentCycleEndAt),
          inArray(table.status, ["draft", "unpaid"])
        ),
    })

    return pendingInvoice
  }

  private async createInvoiceSubscriptionPhase(payload: {
    phaseId: string
    startAt: number
    endAt: number
    now: number
  }): Promise<
    Result<
      {
        invoice: SubscriptionInvoice
      },
      UnPriceSubscriptionError
    >
  > {
    const { phaseId, startAt, endAt, now } = payload

    const subscription = this.subscription
    const phase = this.getActivePhase()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    const customer = this.customer
    const planVersion = phase.planVersion
    const currentState = this.getCurrentState()

    // check if the phase is active and invoicing status
    if (!phase.active || currentState !== "pending_invoice") {
      return Err(new UnPriceSubscriptionError({ message: "Phase is not active or not invoicing" }))
    }

    // check if the subscription should be invoiced
    if (subscription.nextInvoiceAt && subscription.nextInvoiceAt > now) {
      return Err(new UnPriceSubscriptionError({ message: "Subscription not ready to be invoiced" }))
    }

    // first of we need to verify there isn't a pending invoice for this phase - if so we need to use it
    const pendingInvoice = await this.getPendingPhaseInvoice()

    let invoiceId = newId("invoice")

    if (pendingInvoice) {
      invoiceId = pendingInvoice.id as `inv_${string}`
    }

    // check if the subscription requires a payment method and if the customer hasn't one
    const requiredPaymentMethod = planVersion?.paymentMethodRequired
    // TODO: we need to get the payment method from the current one the customers has
    const hasPaymentMethod =
      phase.paymentMethodId ?? customer.metadata?.stripeDefaultPaymentMethodId

    if (requiredPaymentMethod && !hasPaymentMethod) {
      return Err(
        new UnPriceSubscriptionError({
          message: "Customer has no payment method",
          context: {
            phaseId,
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
    // calculate the grace period end date
    const pastDueAt = addDays(dueAt, phase.gracePeriod).getTime()

    // I have to update periods and invoice dates in the subscription

    // fix this
    const invoice = await this.db
      .insert(invoices)
      .values({
        id: invoiceId,
        subscriptionId: subscription.id,
        subscriptionPhaseId: phaseId,
        cycleStartAt: startAt,
        cycleEndAt: endAt,
        status: "draft",
        // pay_in_advance: the invoice is flat, only flat charges, usage charges are combined in the next cycle
        // pay_in_arrear: the invoice is hybrid (flat + usage)
        // TODO: we need a way to check if the invoice include usage charges from past cycles
        type: whenToBill === "pay_in_advance" ? "flat" : "hybrid",
        dueAt,
        pastDueAt,
        total: "0", // this will be updated when the invoice is finalized
        invoiceUrl: "",
        invoiceId: "",
        paymentProvider: planVersion?.paymentProvider ?? "stripe",
        projectId: subscription.projectId,
        collectionMethod,
        currency: planVersion?.currency ?? "USD",
      })
      .onConflictDoNothing()
      .returning()
      .then((res) => res[0])

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
  }): Promise<Result<void, UnPriceSubscriptionError>> {
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
    if (invoice.status === "unpaid") {
      return Ok(undefined)
    }

    // TODO: how to handle multiple invoices?
    const { paymentProvider, currency } = invoice
    const paymentProviderInvoice = {
      invoiceId: "",
      invoiceUrl: "",
      total: 0,
    }

    switch (paymentProvider) {
      case "stripe": {
        const stripe = new StripePaymentProvider({
          paymentCustomerId: this.customer.stripeCustomerId,
          logger: this.logger,
        })

        const defaultPaymentMethodId = await stripe.getDefaultPaymentMethodId()

        if (defaultPaymentMethodId.err) {
          return Err(new UnPriceSubscriptionError({ message: defaultPaymentMethodId.err.message }))
        }

        const stripeInvoice = await stripe.createInvoice({
          currency,
          customerName: this.customer.name,
          email: this.customer.email,
          startCycle: invoice.cycleStartAt,
          endCycle: invoice.cycleEndAt,
          collectionMethod: invoice.collectionMethod,
          description: "Invoice for the cycle from...",
        })

        if (stripeInvoice.err) {
          return Err(new UnPriceSubscriptionError({ message: "Error creating stripe invoice" }))
        }

        const invoiceItemsPrice = await this.calculateSubscriptionPhaseItemsPrice({
          invoice,
        })

        if (invoiceItemsPrice.err) {
          return Err(
            new UnPriceSubscriptionError({ message: "Error calculating invoice items price" })
          )
        }

        for (const item of invoiceItemsPrice.val.items) {
          // get total in cents
          const { amount } = toStripeMoney(item.price.unitPrice.dinero)

          paymentProviderInvoice.total += amount

          // update the invoice with the items price
          await stripe.addInvoiceItem({
            invoiceId: stripeInvoice.val.invoice.id,
            name: item.productSlug,
            productId: item.productId,
            isProrated: item.isProrated,
            amount,
            quantity: item.quantity,
            currency: invoice.currency,
          })
        }

        paymentProviderInvoice.invoiceId = stripeInvoice.val.invoice.id
        paymentProviderInvoice.invoiceUrl = stripeInvoice.val.invoice.invoice_pdf ?? ""

        break
      }
      default:
        return Err(new UnPriceSubscriptionError({ message: "Unsupported payment provider" }))
    }

    // update the invoice with the stripe invoice id
    await this.db
      .update(invoices)
      .set({
        invoiceId: paymentProviderInvoice.invoiceId,
        invoiceUrl: paymentProviderInvoice.invoiceUrl,
        total: paymentProviderInvoice.total.toString(),
        status: "unpaid",
      })
      .where(eq(invoices.id, invoice.id))

    // for billing an invoice we need to check if the invoice is closed or not
    // also we need to check the type of the invoice and the payment provider
    // for now we will only support stripe

    // the invoice could have fixed charges and usage charges
    // we need to check if the invoice has usage charges and if so we need to calculate the usage
    // we need to update the invoice with the correct amounts

    // bill the invoice
    return Ok(undefined)
  }

  private async billSubscriptionPhase(): Promise<Result<void, UnPriceSubscriptionError>> {
    const phase = this.getActivePhase()

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    // get all pending invoices for the phase
    // we combine all invoices for the phase because they are all due at the same time
    // also this is better experience for the customer because we can send a single invoice instead of sending many
    const invoicesData = await this.db.query.invoices.findMany({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionId, this.subscription.id),
          inArray(table.status, ["unpaid", "draft"])
        ),
    })

    if (!invoicesData.length) {
      return Err(
        new UnPriceSubscriptionError({ message: "No pending invoices found for the phase" })
      )
    }

    // check if the invoices are due
    if (invoicesData.some((invoice) => invoice.dueAt && invoice.dueAt > Date.now())) {
      return Err(new UnPriceSubscriptionError({ message: "Invoices are not due yet" }))
    }

    const invoice = invoicesData[0]

    if (!invoice) {
      return Err(new UnPriceSubscriptionError({ message: "No invoice found" }))
    }

    // TODO: how to handle multiple invoices?
    const { paymentProvider, collectionMethod, currency } = invoice

    switch (paymentProvider) {
      case "stripe": {
        const stripe = new StripePaymentProvider({
          paymentCustomerId: this.customer.stripeCustomerId,
          logger: this.logger,
        })

        const defaultPaymentMethodId = await stripe.getDefaultPaymentMethodId()

        if (defaultPaymentMethodId.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error getting default payment method: ${defaultPaymentMethodId.err.message}`,
            })
          )
        }

        const stripeInvoice = await stripe.createInvoice({
          currency,
          customerName: this.customer.name,
          email: this.customer.email,
          startCycle: invoice.cycleStartAt,
          endCycle: invoice.cycleEndAt,
          collectionMethod,
          description: "Invoice for the cycle from...",
        })

        if (stripeInvoice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error creating stripe invoice: ${stripeInvoice.err.message}`,
            })
          )
        }

        const invoiceItemsPrice = await this.calculateSubscriptionPhaseItemsPrice({
          invoice,
        })

        if (invoiceItemsPrice.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error calculating invoice items price: ${invoiceItemsPrice.err.message}`,
            })
          )
        }

        let invoiceTotal = 0

        for (const item of invoiceItemsPrice.val.items) {
          // get total in cents
          const { amount } = toStripeMoney(item.price.unitPrice.dinero)

          invoiceTotal += amount

          // update the invoice with the items price
          await stripe.addInvoiceItem({
            invoiceId: stripeInvoice.val.invoice.id,
            name: item.productSlug,
            productId: item.productId,
            isProrated: item.isProrated,
            amount,
            quantity: item.quantity,
            currency: invoice.currency,
          })
        }

        // update the invoice with the stripe invoice id
        await this.db
          .update(invoices)
          .set({
            invoiceId: stripeInvoice.val.invoice.id,
            invoiceUrl: stripeInvoice.val.invoice.invoice_pdf,
            total: invoiceTotal.toString(),
          })
          .where(eq(invoices.id, invoice.id))

        // collect the payment
        if (collectionMethod === "charge_automatically") {
          const stripePayment = await stripe.collectPayment({
            invoiceId: stripeInvoice.val.invoice.id,
            paymentMethodId: defaultPaymentMethodId.val,
          })

          if (stripePayment.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error collecting payment: ${stripePayment.err.message}`,
              })
            )
          }

          // update the invoice status
          await this.db
            .update(invoices)
            .set({
              status: "paid",
              invoiceId: stripeInvoice.val.invoice.id,
              invoiceUrl: stripeInvoice.val.invoice.invoice_pdf,
            })
            .where(eq(invoices.id, invoice.id))
        } else if (collectionMethod === "send_invoice") {
          const stripeSendInvoice = await stripe.sendInvoice({
            invoiceId: stripeInvoice.val.invoice.id,
          })

          if (stripeSendInvoice.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error sending invoice: ${stripeSendInvoice.err.message}`,
              })
            )
          }
        }

        break
      }
      default:
        return Err(new UnPriceSubscriptionError({ message: "Unsupported payment provider" }))
    }

    // for billing an invoice we need to check if the invoice is closed or not
    // also we need to check the type of the invoice and the payment provider
    // for now we will only support stripe

    // the invoice could have fixed charges and usage charges
    // we need to check if the invoice has usage charges and if so we need to calculate the usage
    // we need to update the invoice with the correct amounts

    // bill the invoice
    return Ok(undefined)
  }

  private async collectInvoicePayment(payload: {
    invoice: SubscriptionInvoice
  }): Promise<Result<{ status: InvoiceStatus; retries: number }, UnPriceSubscriptionError>> {
    const { invoice } = payload
    let result: InvoiceStatus = "waiting"

    // TODO: how to handle multiple invoices?
    const { collectionMethod, paymentProvider, invoiceId, status, paymentAttempts } = invoice

    // if the invoice is not unpaid, we don't need to collect the payment
    if (status !== "unpaid") {
      return Err(new UnPriceSubscriptionError({ message: "Invoice is not finalized" }))
    }

    // check if the invoice is due
    if (invoice.dueAt && invoice.dueAt > Date.now()) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice is not due yet" }))
    }

    // check if the invoice is waiting for payment or already paid
    if (invoice.status === "waiting" || invoice.status === "paid") {
      return Ok({ status: invoice.status, retries: paymentAttempts?.length ?? 0 })
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

    // validate the invoice id
    if (!invoiceId) {
      return Err(new UnPriceSubscriptionError({ message: "Invoice id is required" }))
    }

    switch (paymentProvider) {
      case "stripe": {
        const stripe = new StripePaymentProvider({
          paymentCustomerId: this.customer.stripeCustomerId,
          logger: this.logger,
        })

        const defaultPaymentMethodId = await stripe.getDefaultPaymentMethodId()

        if (defaultPaymentMethodId.err) {
          return Err(
            new UnPriceSubscriptionError({
              message: `Error getting default payment method: ${defaultPaymentMethodId.err.message}`,
            })
          )
        }

        // collect the payment
        if (collectionMethod === "charge_automatically") {
          const stripePaymentInvoice = await stripe.collectPayment({
            invoiceId: invoiceId,
            paymentMethodId: defaultPaymentMethodId.val,
          })

          if (stripePaymentInvoice.err) {
            // update the attempt
            await this.db
              .update(invoices)
              .set({
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

          // update the invoice status
          await this.db
            .update(invoices)
            .set({
              status: "paid",
              paidAt: Date.now(),
              paymentAttempts: [
                ...(paymentAttempts ?? []),
                { status: "paid", createdAt: Date.now() },
              ],
            })
            .where(eq(invoices.id, invoice.id))

          result = "paid"
        } else if (collectionMethod === "send_invoice") {
          const stripeSendInvoice = await stripe.sendInvoice({
            invoiceId: invoiceId,
          })

          if (stripeSendInvoice.err) {
            return Err(
              new UnPriceSubscriptionError({
                message: `Error sending invoice: ${stripeSendInvoice.err.message}`,
              })
            )
          }

          // update the invoice status
          await this.db
            .update(invoices)
            .set({
              status: "waiting",
            })
            .where(eq(invoices.id, invoice.id))

          // this is a manual payment and we check with background job if the payment is successful
          result = "waiting"
        }

        break
      }
      default:
        return Err(
          new UnPriceSubscriptionError({
            message: `Unsupported payment provider: ${paymentProvider}`,
          })
        )
    }

    return Ok({ status: result, retries: paymentAttempts?.length ?? 0 })
  }

  private async calculateSubscriptionPhaseItemsPrice(payload: {
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
    const { invoice } = payload
    const invoiceType = invoice.type
    const phase = this.getActivePhase()
    const subscription = this.subscription

    if (!phase) {
      return Err(new UnPriceSubscriptionError({ message: "No active phase with the given id" }))
    }

    // calculate proration
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      currentCycleStartAt: invoice.cycleStartAt,
      billingCycleStart: invoice.cycleStartAt,
      billingPeriod: phase.planVersion?.billingPeriod ?? "month",
    })

    const proration = calculatedCurrentBillingCycle.prorationFactor

    const invoiceItems = []

    // get the items that are billable for the invoice
    const billableItems =
      invoiceType === "hybrid"
        ? phase.items
        : invoiceType === "flat"
          ? phase.items.filter((item) => item.featurePlanVersion.featureType === "flat")
          : phase.items.filter((item) => item.featurePlanVersion.featureType === "usage")

    try {
      // create an invoice item for each feature
      for (const item of billableItems) {
        let prorate = proration
        // proration is supported for fixed cost items - not for usage
        if (item.featurePlanVersion.featureType === "usage") {
          prorate = 1
        }

        let quantity = 0

        // get usage only for usage features - the rest are calculated from the subscription items
        if (item.featurePlanVersion.featureType !== "usage") {
          quantity = item.units! // all non usage features have a default quantity
        } else {
          const usage = await this.analytics
            .getTotalUsagePerFeature({
              featureSlug: item.featurePlanVersion.feature.slug,
              projectId: subscription.projectId,
              customerId: this.customer.id,
              start: subscription.currentCycleStartAt,
              end: subscription.currentCycleEndAt,
            })
            .then((usage) => usage.data[0])

          const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

          quantity = units
        }

        // this.logger.info(`usage is ${item.featurePlanVersion.feature.slug}`, {
        //   quantity,
        //   feature: item.featurePlanVersion.feature.slug,
        //   prorate,
        // })

        // TODO: handle this issues - what happens with the invoice if this fails?
        // better preview the invoice before creating it
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
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }

      const renew = await this.transition("RENEW", { now })

      if (renew.err) {
        return Err(renew.err)
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
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }

      const renew = await this.transition("RENEW", { now })

      if (renew.err) {
        return Err(renew.err)
      }
    } else if (currentState === "past_due") {
      const pendingInvoice = await this.getPendingPhaseInvoice()

      if (!pendingInvoice?.id) {
        return Err(new UnPriceSubscriptionError({ message: "No pending invoice found" }))
      }

      const invoiceId = pendingInvoice.id

      const collectPayment = await this.transition("COLLECT_PAYMENT", {
        invoiceId: invoiceId,
      })

      if (collectPayment.err) {
        return Err(collectPayment.err)
      }

      const renew = await this.transition("RENEW", { now })

      if (renew.err) {
        return Err(renew.err)
      }
    } else if (currentState === "active") {
      // continue from active
      const renew = await this.transition("RENEW", { now })

      if (renew.err) {
        return Err(renew.err)
      }
    }

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
}
