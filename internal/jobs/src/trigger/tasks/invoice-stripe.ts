import { logger, task } from "@trigger.dev/sdk/v3"
import { db, eq } from "@unprice/db"
import { billingCycleInvoices } from "@unprice/db/schema"
import { toStripeMoney } from "@unprice/db/utils"
import { calculatePricePerFeature, configureBillingCycleSubscription } from "@unprice/db/validators"
import { Stripe } from "@unprice/stripe"
import { Analytics } from "@unprice/tinybird"
import { env } from "../../env.mjs"
import { invoiceStripeItemsTask } from "./invoice-stripe-items"

export const invoiceStripeTask = task({
  id: "invoice.stripe",
  run: async ({
    subscriptionId,
    currentCycleStartAt,
    currentCycleEndAt,
    invoiceId,
  }: {
    subscriptionId: string
    currentCycleStartAt: number
    currentCycleEndAt: number
    invoiceId: string
  }) => {
    // find the invoices for the subscription
    const invoice = await db.query.billingCycleInvoices.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.id, invoiceId),
          operators.eq(fields.subscriptionId, subscriptionId),
          operators.eq(fields.currentCycleStartAt, currentCycleStartAt),
          operators.eq(fields.currentCycleEndAt, currentCycleEndAt)
        )
      },
      with: {
        subscription: {
          with: {
            customer: true,
            planVersion: true,
            items: {
              with: {
                featurePlanVersion: {
                  with: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      logger.error(`Invoice ${invoiceId} not found`)
      return
    }

    if (invoice.status !== "draft") {
      logger.info(`Invoice ${invoiceId} is not in draft status, skipping`)
      return
    }

    const stripe = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2023-10-16",
      typescript: true,
    })

    const tinybird = new Analytics({
      tinybirdToken: env.TINYBIRD_TOKEN,
      emit: true,
    })

    const subscription = invoice.subscription

    if (!subscription) {
      logger.error(`Subscription ${subscriptionId} not found`)
      return
    }

    const customerPaymentProviderId = subscription.customer.stripeCustomerId

    if (!customerPaymentProviderId) {
      logger.error(`Customer ${subscription.customer.id} has no payment customer id`)
      return
    }

    const getPaymentMethodId = async ({
      customerId,
      paymentMethodId,
    }: {
      customerId: string
      paymentMethodId: string | null
    }) => {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        limit: 3,
      })

      const defaultPaymentMethod = paymentMethods.data.find((pm) => pm.id === paymentMethodId)

      if (!defaultPaymentMethod) {
        return paymentMethods.data.at(0)?.id
      }

      return defaultPaymentMethod.id
    }

    const paymentMethodId = await getPaymentMethodId({
      customerId: customerPaymentProviderId,
      paymentMethodId: subscription.defaultPaymentMethodId,
    })

    if (!paymentMethodId) {
      logger.error(`Customer ${subscription.customer.id} has no payment method`)
      return
    }

    const billingPeriod = `${new Date(currentCycleStartAt).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })} - ${new Date(currentCycleEndAt).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })}`

    const stripeInvoice = await stripe.invoices.create({
      customer: customerPaymentProviderId,
      default_payment_method: paymentMethodId,
      currency: subscription.planVersion.currency,
      custom_fields: [
        {
          name: "Customer",
          value: subscription.customer.name,
        },
        {
          name: "Email",
          value: subscription.customer.email,
        },
        {
          name: "Billing Period",
          value: billingPeriod,
        },
      ],
    })

    // calculate proration
    const calculatedCurrentBillingCycle = configureBillingCycleSubscription({
      // the start of the new cycle is the end of the old cycle
      currentCycleStartAt: subscription.currentCycleStartAt,
      billingCycleStart: subscription.startCycle,
      billingPeriod: subscription.planVersion.billingPeriod ?? "month",
    })

    const proration = calculatedCurrentBillingCycle.prorationFactor

    logger.info(`proration is ${proration}`)

    const invoiceItems = []

    // create an invoice item for each feature
    for (const item of subscription.items) {
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
        const usage = await tinybird
          .getTotalUsagePerFeature({
            featureSlug: item.featurePlanVersion.feature.slug,
            projectId: subscription.projectId,
            customerId: subscription.customer.id,
            start: subscription.currentCycleStartAt,
            end: subscription.currentCycleEndAt,
          })
          .then((usage) => usage.data[0])

        const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

        quantity = units
      }

      logger.info(`usage is ${item.featurePlanVersion.feature.slug}`, {
        quantity,
        feature: item.featurePlanVersion.feature.slug,
        prorate,
      })

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

      // get total in cents
      const { amount, currency } = toStripeMoney(priceCalculation.val.totalPrice.dinero)

      logger.info(`priceCalculation is ${item.featurePlanVersion.feature.slug}`, {
        amount,
        currency,
        feature: item.featurePlanVersion.feature.slug,
      })

      // create an invoice item for each feature
      invoiceItems.push({
        payload: {
          customerPaymentProviderId,
          invoiceId: stripeInvoice.id,
          quantity,
          currency,
          prorate,
          productId: item.featurePlanVersion.feature.id,
          amount,
          productSlug: item.featurePlanVersion.feature.slug,
        },
      })
    }

    // // create an invoice item for each feature
    await invoiceStripeItemsTask.batchTriggerAndWait(invoiceItems)

    // update the invoice with the stripe invoice id
    await db
      .update(billingCycleInvoices)
      .set({
        invoiceId: stripeInvoice.id,
        status: "unpaid",
        total: stripeInvoice.amount_due.toString(),
      })
      .where(eq(billingCycleInvoices.id, invoiceId))

    // finizalize the invoice
    await stripe.invoices.finalizeInvoice(stripeInvoice.id, {
      auto_advance: subscription.whenToBill === "pay_in_advance",
    })
  },
})
