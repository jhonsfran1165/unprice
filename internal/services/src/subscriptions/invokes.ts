import { and, eq } from "@unprice/db"
import { db } from "@unprice/db"
import { invoices, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { type InvoiceType, configureBillingCycleSubscription } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import { addDays, addMinutes } from "date-fns"
import type { SubscriptionContext } from "./types"
import { validatePaymentMethod } from "./utils"

export async function loadSubscription(payload: {
  context: SubscriptionContext
  logger: Logger
}): Promise<SubscriptionContext> {
  const { context, logger } = payload
  const { subscriptionId, projectId, now } = context

  const result = await db.query.subscriptions.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, subscriptionId), eq(table.projectId, projectId)),
    with: {
      phases: {
        with: {
          planVersion: true,
        },
      },
      customer: true,
    },
  })

  if (!result) {
    throw new Error(`Subscription with ID ${subscriptionId} not found`)
  }

  const { phases, customer, ...subscription } = result

  if (!customer) {
    throw new Error(`Customer with ID ${result.customerId} not found`)
  }

  // phase can be undefined if the subscription is paused or ended but still the machine can be in active state
  //  for instance the subscription was pasued there is no current phase but there is an option to resume and
  // subscribe to a new phase
  const currentPhase = phases.find(
    (phase) => phase.startAt <= now && (!phase.endAt || phase.endAt > now)
  )

  // check the payment method as well
  const { paymentMethodId, requiredPaymentMethod } = await validatePaymentMethod({
    customer,
    paymentProvider: currentPhase?.planVersion.paymentProvider,
    requiredPaymentMethod: currentPhase?.planVersion.paymentMethodRequired,
    logger: logger,
  })

  return {
    now,
    subscriptionId: subscription.id,
    projectId: subscription.projectId,
    customer,
    currentPhase: currentPhase
      ? {
          ...currentPhase,
          // items are not needed for the machine
          items: [],
        }
      : null,
    subscription,
    paymentMethodId,
    requiredPaymentMethod,
  }
}

export async function renewSubscription({ context }: { context: SubscriptionContext }) {
  const { subscription, currentPhase, subscriptionId } = context

  if (!currentPhase) throw new Error("No active phase found")

  const billingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping
    billingConfig: currentPhase.planVersion.billingConfig,
    endAt: currentPhase.endAt ?? undefined,
    alignStartToDay: false, // we pick the date as it is and align the end to the day
    alignEndToDay: true,
    alignToCalendar: true,
  })

  const renewAt =
    currentPhase.planVersion.whenToBill === "pay_in_advance"
      ? billingCycle.cycleStartMs
      : billingCycle.cycleEndMs

  // update subscription and current phase last renew at
  const result = await db
    .update(subscriptions)
    .set({
      currentCycleStartAt: billingCycle.cycleStartMs,
      currentCycleEndAt: billingCycle.cycleEndMs,
      renewAt: renewAt,
      lastRenewAt: subscription.renewAt,
      previousCycleStartAt: subscription.currentCycleStartAt,
      previousCycleEndAt: subscription.currentCycleEndAt,
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning()
    .then((result) => result[0])

  if (!result) throw new Error("Subscription not found, or not updated")

  return {
    subscription: result,
  }
}

export async function invoiceSubscription({
  context,
  isTrialEnding = false, // if true, we are ending the trial, so we have to invoice the subscription depending on the whenToBill setting
}: { context: SubscriptionContext; isTrialEnding?: boolean }): Promise<
  Partial<SubscriptionContext>
> {
  const { subscriptionId, currentPhase, subscription } = context

  if (!currentPhase) throw new Error("No active phase found")

  const whenToBill = currentPhase.planVersion.whenToBill

  // calculate the next billing cycle to get the next invoice at
  const billingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping
    billingConfig: currentPhase.planVersion.billingConfig,
    endAt: currentPhase.endAt ?? undefined,
    alignStartToDay: false,
    alignEndToDay: true,
    alignToCalendar: true,
  })

  // calculate the next invoice at depending on the billing cycle
  const invoiceAt =
    currentPhase.planVersion.whenToBill === "pay_in_advance"
      ? billingCycle.cycleStartMs
      : billingCycle.cycleEndMs

  // only create invoice when trial is false
  // return early if the trial is ending and the whenToBill is pay_in_arrear
  if (isTrialEnding && whenToBill === "pay_in_arrear") {
    // update subscription to set the next invoice at to the end of the trial
    // update the subscription invoice information
    // basically the trial period is over and we want to set a new period to the next invoice
    const result = await db
      .update(subscriptions)
      .set({
        invoiceAt,
        lastInvoiceAt: invoiceAt,
      })
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.projectId, subscription.projectId)
        )
      )
      .returning()
      .then((result) => result[0])

    if (!result) throw new Error("Subscription not found, or not updated")

    return {
      subscription: result,
    }
  }

  // due at activate background job to process the invoice
  const dueAt =
    whenToBill === "pay_in_advance" ? billingCycle.cycleStartMs : billingCycle.cycleEndMs

  // this help us test 5 min subscriptions in development
  const intervalFucntion =
    currentPhase.planVersion.billingConfig.billingInterval === "minute" ? addMinutes : addDays

  // calculate the grace period based on the due date
  // this is when the invoice will be considered past due after that if not paid we can end it, cancel it, etc.
  const pastDueAt = intervalFucntion(dueAt, currentPhase.planVersion.gracePeriod).getTime()

  // if the subscription is ending the trial, we will only charge the flat charges
  // why? because the trial is over and we want to charge the flat charges in advance. Usage would be charged in the next billing period
  const invoiceType = (isTrialEnding ? "flat" : "hybrid") as InvoiceType

  // this should happen in a transaction
  const result = await db.transaction(async (tx) => {
    // Execute all operations in parallel and wait for them to complete
    const [invoice, subscriptionData] = await Promise.all([
      // Create invoice
      tx
        .insert(invoices)
        .values({
          id: newId("invoice"),
          subscriptionId: subscription.id,
          subscriptionPhaseId: currentPhase.id,
          cycleStartAt: subscription.currentCycleStartAt,
          cycleEndAt: subscription.currentCycleEndAt,
          paymentMethodId: context.paymentMethodId,
          status: "draft",
          type: invoiceType,
          whenToBill: currentPhase.planVersion.whenToBill,
          dueAt,
          pastDueAt,
          total: 0,
          subtotal: 0,
          amountCreditUsed: 0,
          invoicePaymentProviderUrl: "",
          invoicePaymentProviderId: "",
          customerId: subscription.customerId,
          paymentProvider: currentPhase.planVersion.paymentProvider,
          requiredPaymentMethod: currentPhase.planVersion.paymentMethodRequired,
          projectId: subscription.projectId,
          collectionMethod: currentPhase.planVersion.collectionMethod,
          currency: currentPhase.planVersion.currency,
          previousCycleStartAt: subscription.previousCycleStartAt,
          previousCycleEndAt: subscription.previousCycleEndAt,
          metadata: {
            note: "Invoice drafted by the system, waiting billing",
            reason: isTrialEnding ? "trial_ended" : undefined,
          },
        })
        .returning()
        .then((result) => result[0]),
      // Update subscription
      tx
        .update(subscriptions)
        .set({
          invoiceAt,
          lastInvoiceAt: subscription.invoiceAt,
        })
        .where(
          and(
            eq(subscriptions.id, subscriptionId),
            eq(subscriptions.projectId, subscription.projectId)
          )
        )
        .returning()
        .then((result) => result[0]),
    ])

    if (!invoice) throw new Error("Invoice not found, or not created")
    if (!subscriptionData) throw new Error("Subscription not found, or not updated")

    return {
      subscription: subscriptionData,
      invoice: invoice,
    }
  })

  return {
    subscription: result.subscription,
  }
}
