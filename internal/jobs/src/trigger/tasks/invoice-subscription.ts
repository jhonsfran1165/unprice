import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import { newId } from "@unprice/db/utils"
import { configureBillingCycleSubscription } from "@unprice/db/validators"
import { addDays } from "date-fns"
import { invoiceStripeTask } from "./invoice-stripe"

export const invoiceSubscriptionTask = task({
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
    // then renew the subscription if it's autorenew
    // then notify the customer if the collection method is send_invoice
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
      return {
        message: "Subscription not found or not active",
        subscriptionId: subscriptionId,
      }
    }

    // check if the subscription is still in trial
    const isTrial = subscription.trialEndsAt && subscription.trialEndsAt > currentDate

    if (isTrial) {
      logger.info(`Subscription ${subscriptionId} is still in trial`)
      return {
        message: "Subscription is still in trial",
        subscriptionId: subscription.id,
      }
    }

    const shouldBeInvoiced = subscription.nextInvoiceAt < currentDate

    if (!shouldBeInvoiced) {
      logger.info(
        `Subscription ${subscriptionId} should be invoice at ${new Date(
          subscription.nextInvoiceAt
        ).toISOString()}`
      )
      return {
        message: "Subscription should be invoice at a different time",
        subscriptionId: subscription.id,
      }
    }

    // TODO: we could fetch the last invoice and check if the next invoice is due
    // find out if the subscription has an invoice for the current billing cycle
    const currentBillingCycleInvoice = await db.query.billingCycleInvoices
      .findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.subscriptionId, subscription.id),
            operators.eq(fields.currentCycleStartAt, subscription.currentCycleStartAt),
            operators.eq(fields.currentCycleEndAt, subscription.currentCycleEndAt)
          )
        },
      })
      .catch((e) => {
        logger.error(
          `Error fetching current billing cycle invoice for subscription ${subscriptionId}`,
          e
        )
        return null
      })

    if (currentBillingCycleInvoice?.id) {
      logger.info(
        `Subscription ${subscriptionId} already has an invoice for the current billing cycle ${currentBillingCycleInvoice.id}`
      )
      return {
        message: "Invoice already exists",
        subscriptionId: subscription.id,
      }
    }

    const customer = subscription.customer
    const planVersion = subscription.planVersion

    // set the next billing cycle given the billing cycle start and end
    const calculatedNextBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      currentCycleStartAt: subscription.currentCycleEndAt + 1, // +1 because we dont want to include the current cycle in the next invoice
      billingCycleStart: subscription.startCycle,
      billingPeriod: planVersion.billingPeriod ?? "month",
    })

    // check if the subscription requires a payment method and if the customer hasn't one
    const requiredPaymentMethod = planVersion.paymentMethodRequired
    // TODO: we need to get the payment method from the current one the customers has
    const hasPaymentMethod =
      subscription.defaultPaymentMethodId ?? customer.metadata?.stripeDefaultPaymentMethodId

    const whenToBill = subscription.whenToBill
    const collectionMethod = subscription.collectionMethod

    // calculate the grace period end date
    const gracePeriodEndsAt = addDays(
      whenToBill === "pay_in_advance"
        ? subscription.currentCycleStartAt
        : subscription.currentCycleEndAt,
      subscription.gracePeriod
    ).getTime()

    // autorenew if the subscription is autorenew
    const autorenew = subscription.autoRenew

    // if the plan needs a payment method and the customer does not have one yet
    if (requiredPaymentMethod && !hasPaymentMethod) {
      logger.info(
        `Subscription ${subscriptionId} requires a payment method and the customer does not have one`
      )

      // move the subscription to past due
      await db
        .update(schema.subscriptions)
        .set({
          status: "past_due",
          pastDueAt: gracePeriodEndsAt,
          metadata: {
            ...subscription.metadata,
            reason: "payment_method_not_found",
            note: "Payment method required and missing",
          },
        })
        .where(eq(schema.subscriptions.id, subscription.id))

      return {
        message: "Subscription moved to past due",
        subscriptionId: subscription.id,
      }
    }

    // Create the invoice for the billing cycle
    // at this point we know that the subscription is not in trial, and it has a payment method
    // so we can create the invoice
    const invoice = await db
      .insert(schema.billingCycleInvoices)
      .values({
        id: newId("billing_cycle_invoice"),
        subscriptionId: subscription.id,
        projectId: subscription.projectId,
        currentCycleStartAt: subscription.currentCycleStartAt,
        currentCycleEndAt: subscription.currentCycleEndAt,
        dueAt:
          subscription.whenToBill === "pay_in_advance"
            ? subscription.currentCycleStartAt
            : subscription.currentCycleEndAt,
        status: "draft", // we draft the invoice right away and other tasks will update the amount due
        // it's important to differentiate between the type of the invoice, because for pay in advance we bill 2 times first flat then usage
        // and for pay in arrear we bill 1 time (flat + usage) = hybrid
        type: subscription.whenToBill === "pay_in_advance" ? "flat" : "hybrid",
        total: "0",
        billedAt: currentDate,
        collectionMethod: collectionMethod,
        currency: planVersion.currency,
        paymentProvider: planVersion.paymentProvider,
      })
      .returning()
      .then((invoice) => invoice[0])

    if (!invoice) {
      logger.error(`Error creating invoice for subscription ${subscriptionId}`)
      return {
        message: "Error creating invoice",
        subscriptionId: subscription.id,
      }
    }

    // support usage based billing and proration
    // TODO: create the invoice depending on the payment provider
    switch (subscription.planVersion.paymentProvider) {
      case "stripe":
        await invoiceStripeTask.triggerAndWait({
          subscriptionId,
          currentCycleStartAt: subscription.currentCycleStartAt,
          currentCycleEndAt: subscription.currentCycleEndAt,
          invoiceId: invoice.id,
        })
        break
      default:
        logger.error(`Unsupported payment provider ${subscription.planVersion.paymentProvider}`)
        return {
          message: "Unsupported payment provider",
          subscriptionId: subscription.id,
        }
    }

    // TODO: this should be a separate task for the billing cycle invoice
    if (whenToBill === "pay_in_advance") {
      // update the subscription with the new billing cycle
      await db
        .update(schema.subscriptions)
        .set({
          // update the lastBilledAt to the current date
          lastInvoiceAt: subscription.currentCycleStartAt,
          // set the next billing date to the end of the current billing cycle
          nextInvoiceAt: subscription.currentCycleEndAt,
        })
        .where(eq(schema.subscriptions.id, subscription.id))
    }

    if (whenToBill === "pay_in_arrear") {
      await db
        .update(schema.subscriptions)
        .set({
          currentCycleStartAt: calculatedNextBillingCycle.cycleStart.getTime(),
          currentCycleEndAt: calculatedNextBillingCycle.cycleEnd.getTime(),
          nextInvoiceAt: calculatedNextBillingCycle.cycleEnd.getTime(),
          prorated: calculatedNextBillingCycle.prorationFactor < 1,
          // update the lastBilledAt to the current date
          lastInvoiceAt: subscription.currentCycleStartAt,
        })
        .where(eq(schema.subscriptions.id, subscription.id))
    }

    // renew the subscription if it's autorenew
    if (autorenew) {
      await db
        .update(schema.subscriptions)
        .set({
          status: "active",
          currentCycleStartAt: calculatedNextBillingCycle.cycleStart.getTime(),
          currentCycleEndAt: calculatedNextBillingCycle.cycleEnd.getTime(),
          nextInvoiceAt:
            whenToBill === "pay_in_advance"
              ? calculatedNextBillingCycle.cycleStart.getTime()
              : calculatedNextBillingCycle.cycleEnd.getTime(),
          pastDueAt: null,
        })
        .where(eq(schema.subscriptions.id, subscription.id))
    }

    // TODO: notify the user that the invoice is ready if the collection method is send_invoice
    if (collectionMethod === "send_invoice") {
      // TODO: send the invoice to the customer
    }
  },
})
