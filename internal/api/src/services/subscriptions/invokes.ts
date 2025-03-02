import { and, db, eq } from "@unprice/db"
import { invoices, subscriptions } from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { type InvoiceType, configureBillingCycleSubscription } from "@unprice/db/validators"
import type { Logger } from "@unprice/logging"
import { addDays } from "date-fns"
import type { SubscriptionContext } from "./types"
import { validatePaymentMethod } from "./utils"

export async function loadSubscription({
  subscriptionId,
  projectId,
  logger,
}: { subscriptionId: string; projectId: string; logger: Logger }): Promise<SubscriptionContext> {
  const [subscription, openInvoices] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: (table, { eq }) => eq(table.id, subscriptionId),
      with: {
        phases: {
          with: {
            items: {
              with: {
                featurePlanVersion: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
            planVersion: true,
          },
        },
        customer: true,
      },
    }),
    db.query.invoices.findMany({
      where: (table, { eq, and, inArray }) =>
        and(
          eq(table.subscriptionId, subscriptionId),
          eq(table.projectId, projectId),
          inArray(table.status, ["draft", "unpaid", "failed", "waiting"])
        ),
      orderBy: (table, { asc }) => [asc(table.cycleEndAt)],
      limit: 1,
    }),
  ])

  if (!subscription) {
    throw new Error(`Subscription with ID ${subscriptionId} not found`)
  }

  if (!subscription.customer) {
    throw new Error(`Customer with ID ${subscription.customerId} not found`)
  }

  const now = Date.now()
  const currentPhase = subscription.phases.find(
    (phase) => phase.startAt <= now && (!phase.endAt || phase.endAt > now)
  )

  // // TODO: remove this just for testing
  // if (currentPhase) {
  //   currentPhase = {
  //     ...currentPhase,
  //     trialEndsAt: new Date("2025-03-27").getTime(),
  //   }
  // }

  // check the payment method as well
  const { paymentMethodId, requiredPaymentMethod } = await validatePaymentMethod({
    customer: subscription.customer,
    paymentProvider: currentPhase?.planVersion.paymentProvider,
    requiredPaymentMethod: currentPhase?.planVersion.paymentMethodRequired,
    logger: logger,
  })

  return {
    subscriptionId: subscription.id,
    projectId: subscription.projectId,
    customer: subscription.customer,
    phases: subscription.phases,
    currentPhase: currentPhase ?? null,
    subscription: subscription,
    openInvoices: openInvoices,
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
    trialDays: currentPhase.trialDays,
    endAt: currentPhase.endAt ?? undefined,
    alignStartToDay: false,
    alignEndToDay: true,
    alignToCalendar: true,
  })

  await db
    .update(subscriptions)
    .set({
      currentCycleStartAt: billingCycle.cycleStartMs,
      currentCycleEndAt: billingCycle.cycleEndMs,
      previousCycleStartAt: subscription.currentCycleStartAt,
      previousCycleEndAt: subscription.currentCycleEndAt,
      lastRenewAt: Date.now(),
    })
    .where(eq(subscriptions.id, subscriptionId))

  return {
    subscription: {
      ...context.subscription,
      currentCycleStartAt: billingCycle.cycleStartMs,
      currentCycleEndAt: billingCycle.cycleEndMs,
      lastRenewalAt: Date.now(),
    },
  }
}

export async function invoiceSubscription({
  context,
  isTrialEnding = false,
}: { context: SubscriptionContext; isTrialEnding?: boolean }): Promise<
  Partial<SubscriptionContext>
> {
  const { subscriptionId, currentPhase, subscription } = context

  if (!currentPhase) throw new Error("No active phase found")

  // due at activate background job to process the invoice
  const dueAt =
    currentPhase.planVersion.whenToBill === "pay_in_advance"
      ? subscription.currentCycleStartAt + 1
      : subscription.currentCycleEndAt + 1

  // calculate the grace period based on the due date
  // this is when the invoice will be considered past due after that if not paid we can end it, cancel it, etc.
  const pastDueAt = addDays(dueAt, currentPhase.planVersion.gracePeriod).getTime()
  // if the subscription is ending the trial, we will only charge the flat charges
  const invoiceType = isTrialEnding ? "flat" : ("hybrid" as InvoiceType)

  // calculate the next billing cycle to get the next invoice at
  const billingCycle = configureBillingCycleSubscription({
    currentCycleStartAt: subscription.currentCycleEndAt + 1, // add one millisecond to avoid overlapping
    billingConfig: currentPhase.planVersion.billingConfig,
    trialDays: currentPhase.trialDays,
    endAt: currentPhase.endAt ?? undefined,
    alignStartToDay: false,
    alignEndToDay: true,
    alignToCalendar: true,
  })

  // calculate the next invoice at depending on the billing cycle
  const nextInvoiceAt =
    currentPhase.planVersion.whenToBill === "pay_in_advance"
      ? billingCycle.cycleStartMs + 1
      : billingCycle.cycleEndMs + 1

  // this should happen in a transaction
  const result = await db.transaction(async (tx) => {
    // create the invoice for the current cycle
    // this will charge the customer for the usage of the previous cycle
    // and the flat charges of the current cycle
    const invoice = await tx.insert(invoices).values({
      id: newId("invoice"),
      subscriptionId: subscription.id,
      subscriptionPhaseId: currentPhase.id,
      cycleStartAt: subscription.currentCycleStartAt,
      cycleEndAt: subscription.currentCycleEndAt,
      status: "draft",
      type: invoiceType,
      // this allows us to know when to bill the invoice, when to get usage from past cycles
      whenToBill: currentPhase.planVersion.whenToBill,
      dueAt,
      pastDueAt,
      total: 0, // this will be updated when the invoice is finalized
      subtotal: 0, // this will be updated when the invoice is finalized
      amountCreditUsed: 0, // this will be updated when the invoice is finalized
      invoiceUrl: "", // this will be updated when the invoice is finalized
      invoiceId: "", // this will be updated when the invoice is finalized
      paymentProvider: currentPhase.planVersion.paymentProvider,
      requiredPaymentMethod: currentPhase.planVersion.paymentMethodRequired,
      projectId: subscription.projectId,
      collectionMethod: currentPhase.planVersion.collectionMethod,
      currency: currentPhase.planVersion.currency,
      previousCycleStartAt: subscription.metadata?.dates?.previousCycleStartAt,
      previousCycleEndAt: subscription.metadata?.dates?.previousCycleEndAt,
      metadata: {},
    })

    // update the subscription invoice information
    const subscriptionData = await tx
      .update(subscriptions)
      .set({
        nextInvoiceAt,
        metadata: {
          ...subscription.metadata,
          dates: {
            ...subscription.metadata?.dates,
            lastInvoiceAt: Date.now(),
          },
        },
      })
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.projectId, subscription.projectId)
        )
      )
      .returning()
      .then((res) => res[0])

    return {
      subscriptionId,
      subscription: subscriptionData,
      invoice: invoice,
    }
  })

  return {
    subscriptionId,
    subscription: result.subscription,
  }
}
