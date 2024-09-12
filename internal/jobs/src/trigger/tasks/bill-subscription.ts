import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { configureBillingCycleSubscription } from "@unprice/db/validators"
import { addDays } from "date-fns"

export const billSubscription = task({
  id: "billing.bill.subscription",
  run: async ({
    subscriptionId,
    customerId,
    currentDate,
  }: {
    subscriptionId: string
    customerId: string
    currentDate: number
  }) => {
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

    const shouldBillYet = subscription.nextBillingAt && subscription.nextBillingAt > currentDate

    if (shouldBillYet) {
      logger.info(`Subscription ${subscriptionId} should not be billed yet`)
      return
    }

    // subscription is paid if the lastBilledAt is inside the current billing cycle
    // at the start of the cycle or at the end of the cycle
    // basically you paid either at the start or at the end of the cycle
    const isPaid =
      subscription.lastBilledAt &&
      subscription.lastBilledAt >= subscription.billingCycleStartAt &&
      subscription.lastBilledAt <= subscription.billingCycleEndAt

    if (isPaid) {
      logger.info(`Subscription ${subscriptionId} is already paid`)

      // update to remove the reason and set the status to active
      await db
        .update(schema.subscriptions)
        .set({
          status: "active",
          metadata: {
            ...subscription.metadata,
            reason: undefined,
          },
        })
        .where(eq(schema.subscriptions.id, subscription.id))

      return
    }

    const planVersion = subscription.planVersion
    const customer = subscription.customer

    // set the next billing cycle given the billing cycle start and end
    // TODO: create a test for current Date way after the billing cycle end
    const calculatedNextBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      billingCycleStartAt: subscription.billingCycleEndAt,
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

    // TODO: create the invoice for the billing cycle
    // support usage based billing and proration

    if (
      whenToBill === "pay_in_advance" &&
      subscription.nextBillingAt &&
      subscription.nextBillingAt > currentDate
    ) {
      if (collectionMethod === "charge_automatically") {
        // TODO: bill the customer automatically

        // update the subscription with the new billing cycle
        await db
          .update(schema.subscriptions)
          .set({
            status: "active",
            // update the lastBilledAt to the current date
            lastBilledAt: subscription.billingCycleStartAt,
            // set the next billing date to the end of the current billing cycle
            nextBillingAt: subscription.billingCycleEndAt,
          })
          .where(eq(schema.subscriptions.id, subscription.id))
      }

      if (collectionMethod === "send_invoice") {
        // TODO: send an email to the customer with the invoice
        // TODO: wait until the invoice is paid
        await db
          .update(schema.subscriptions)
          .set({
            status: "past_due",
            pastDueAt: gracePeriodEndsAt,
            metadata: {
              ...subscription.metadata,
              reason: "payment_pending",
              note: "Invoice sent waiting for payment",
            },
          })
          .where(eq(schema.subscriptions.id, subscription.id))
      }
    }

    if (
      whenToBill === "pay_in_arrear" &&
      subscription.nextBillingAt &&
      subscription.nextBillingAt > currentDate
    ) {
      if (collectionMethod === "charge_automatically") {
        // update the subscription with the new billing cycle
        await db
          .update(schema.subscriptions)
          .set({
            status: "active",
            // if the subscription is not in the current cycle, update to the new billing cycle
            billingCycleStartAt: calculatedNextBillingCycle.cycleStart.getTime(),
            billingCycleEndAt: calculatedNextBillingCycle.cycleEnd.getTime(),
            prorated: calculatedNextBillingCycle.prorationFactor < 1,
            // update the lastBilledAt to the current date
            lastBilledAt: subscription.billingCycleStartAt,
          })
          .where(eq(schema.subscriptions.id, subscription.id))
      }

      if (collectionMethod === "send_invoice") {
        // TODO: create an invoice at the end of the billing cycle
        // TODO: send an email to the customer with the invoice
        // TODO: wait until the invoice is paid
        // update the subscription with the new billing cycle
        await db
          .update(schema.subscriptions)
          .set({
            status: "past_due",
            pastDueAt: gracePeriodEndsAt,
            metadata: {
              ...subscription.metadata,
              reason: "payment_pending",
              note: "Invoice sent waiting for payment",
            },
          })
          .where(eq(schema.subscriptions.id, subscription.id))
      }
    }
  },
})
