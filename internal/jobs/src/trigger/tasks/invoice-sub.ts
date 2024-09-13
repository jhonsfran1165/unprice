import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { configureBillingCycleSubscription } from "@unprice/db/validators"
import { addDays } from "date-fns"

export const invoiceSubscription = task({
  id: "invoice.subscription",
  run: async ({
    subscriptionId,
    customerId,
    currentDate,
  }: {
    subscriptionId: string
    customerId: string
    currentDate: number
  }) => {
    // given a subscription id and a customer id, find the subscription and check if it's active
    // and depending on the configuration, create an invoice for the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, subscriptionId),
          operators.eq(fields.customerId, customerId),
          operators.eq(fields.active, true)
        )
      },
      with: {
        planVersion: true,
        customer: true,
        items: {
          with: {
            featurePlanVersion: true,
          },
        },
      },
    })

    if (!subscription) {
      logger.error(`Subscription ${subscriptionId} not found or not active`)
      return
    }

    // check if the subscription is still in trial
    const isTrial = subscription.trialEndsAt && subscription.trialEndsAt > currentDate

    if (isTrial) {
      logger.info(`Subscription ${subscriptionId} is still in trial`)
      return
    }

    const shouldBeInvoiced = subscription.nextInvoiceAt < currentDate

    if (!shouldBeInvoiced) {
      logger.info(`Subscription ${subscriptionId} should not be invoiced yet`)
      return
    }

    // TODO: we could fetch the last invoice and check if the next invoice is due
    // find out if the subscription has an invoice for the current billing cycle
    const currentBillingCycleInvoice = await db.query.billingCycleInvoices.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.subscriptionId, subscription.id),
          operators.eq(fields.billingCycleStartAt, subscription.billingCycleStartAt),
          operators.eq(fields.billingCycleEndAt, subscription.billingCycleEndAt)
        )
      },
    })

    if (currentBillingCycleInvoice) {
      logger.info(
        `Subscription ${subscriptionId} already has an invoice for the current billing cycle`
      )
      return
    }

    const customer = subscription.customer
    const planVersion = subscription.planVersion

    // set the next billing cycle given the billing cycle start and end
    const calculatedNextBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      billingCycleStartAt: subscription.billingCycleEndAt + 1,
      billingCycleStart: subscription.startCycle,
      billingPeriod: planVersion.billingPeriod ?? "month",
    })

    // check if the subscription requires a payment method and if the customer hasn't one
    const requiredPaymentMethod = planVersion.paymentMethodRequired
    const hasPaymentMethod =
      subscription.defaultPaymentMethodId ?? customer.metadata?.stripeDefaultPaymentMethodId

    const whenToBill = subscription.whenToBill
    const collectionMethod = subscription.collectionMethod

    // calculate the grace period end date
    const gracePeriodEndsAt = addDays(
      whenToBill === "pay_in_advance"
        ? subscription.billingCycleStartAt
        : subscription.billingCycleEndAt,
      subscription.gracePeriod
    ).getTime()

    // autorenew if the subscription is autorenew
    // const autorenew = subscription.autoRenew

    // if the plan needs a payment method and the customer does not have one yet
    if (requiredPaymentMethod && !hasPaymentMethod) {
      logger.info(
        `Subscription ${subscriptionId} requires a payment method and the customer does not have one`
      )

      // TODO: here we can downgrade the plan to the default plan right away without waiting for the grace period
      // set the subscription to pending_payment_method
      await db
        .update(schema.subscriptions)
        .set({
          status: "past_due",
          pastDueAt: gracePeriodEndsAt,
          metadata: {
            ...subscription.metadata,
            reason: "pending_payment_method",
            note: "Payment method required and missing",
          },
        })
        .where(eq(schema.subscriptions.id, subscription.id))

      return
    }

    // Create the invoice for the billing cycle
    await db
      .insert(schema.billingCycleInvoices)
      .values({
        id: newId("billing_cycle_invoice"),
        subscriptionId: subscription.id,
        projectId: subscription.projectId, // Assuming subscription has a projectId
        billingCycleStartAt: subscription.billingCycleStartAt,
        billingCycleEndAt: subscription.billingCycleEndAt,
        dueAt:
          subscription.whenToBill === "pay_in_advance"
            ? subscription.billingCycleStartAt
            : subscription.billingCycleEndAt,
        status: "draft",
        type: subscription.whenToBill === "pay_in_advance" ? "flat" : "hybrid",
        total: "0",
        billedAt: currentDate,
        collectionMethod: collectionMethod,

        currency: planVersion.currency,
        paymentProvider: planVersion.paymentProvider,
      })
      .returning()

    // for subscription that are pay in advance, we bill the customer 2 times
    // the first time at the start of the billing cycle and the second time at the end of the billing cycle
    // for subscription that are pay in arrear, we bill the customer at the end of the billing cycle

    // support usage based billing and proration

    // TODO: this should be a separate task for the billing cycle invoice
    if (whenToBill === "pay_in_advance") {
      // update the subscription with the new billing cycle
      await db
        .update(schema.subscriptions)
        .set({
          // update the lastBilledAt to the current date
          lastInvoiceAt: subscription.billingCycleStartAt,
          // set the next billing date to the end of the current billing cycle
          nextInvoiceAt: subscription.billingCycleEndAt,
        })
        .where(eq(schema.subscriptions.id, subscription.id))
    }

    if (whenToBill === "pay_in_arrear") {
      await db
        .update(schema.subscriptions)
        .set({
          billingCycleStartAt: calculatedNextBillingCycle.cycleStart.getTime(),
          billingCycleEndAt: calculatedNextBillingCycle.cycleEnd.getTime(),
          nextInvoiceAt: calculatedNextBillingCycle.cycleEnd.getTime(),
          prorated: calculatedNextBillingCycle.prorationFactor < 1,
          // update the lastBilledAt to the current date
          lastInvoiceAt: subscription.billingCycleStartAt,
        })
        .where(eq(schema.subscriptions.id, subscription.id))
    }
  },
})
