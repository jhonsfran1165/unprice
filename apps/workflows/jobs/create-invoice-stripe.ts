import { calculatePricePerFeature } from "@builderai/db/validators"
import { Analytics } from "@builderai/tinybird"
import { type IO, eventTrigger } from "@trigger.dev/sdk"
import { z } from "zod"
import { connectDatabase } from "~/lib/db"
import { env } from "~/lib/env"
import { client } from "~/trigger"

import { toStripeMoney } from "@builderai/db/utils"
import Stripe from "stripe"

export const createInvoiceStripeJob = client.defineJob({
  id: "billing.invoicing.stripe",
  name: "Collect usage and create invoice for stripe payment provider",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "billing.invoicing.stripe",
    schema: z.object({
      customerId: z.string(),
      subscriptionId: z.string(),
      year: z.number(),
      month: z.number(),
    }),
  }),

  run: async (payload, io, _ctx) => {
    const { customerId, year, month, subscriptionId } = payload

    const db = connectDatabase()
    const stripe = new Stripe(env().STRIPE_API_KEY, {
      apiVersion: "2023-10-16",
      typescript: true,
    })

    const tinybird = new Analytics({
      tinybirdToken: env().TINYBIRD_TOKEN,
      emit: true,
    })

    const subscription = await io.runTask(`get subscription ${subscriptionId}`, async () =>
      db.query.subscriptions.findFirst({
        with: {
          customer: true,
          items: {
            with: {
              featurePlanVersion: {
                with: {
                  feature: true,
                },
              },
            },
          },
          planVersion: {
            columns: {
              paymentProvider: true,
              currency: true,
            },
          },
        },
        where: (table, { and, eq }) =>
          and(
            eq(table.customerId, customerId),
            eq(table.status, "active"),
            eq(table.id, subscriptionId)
          ),
      })
    )

    if (!subscription) {
      throw new Error(`subscription ${subscriptionId} not found`)
    }

    const customerPaymentProviderId = subscription.customer.stripeCustomerId

    if (customerPaymentProviderId === "" || !customerPaymentProviderId) {
      throw new Error(`customer ${customerId} has no payment customer id`)
    }

    const paymentMethodId = await io.runTask(
      `get payment method for subscription ${subscriptionId}`,
      async () => {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerPaymentProviderId,
          limit: 3,
        })

        const defaultPaymentMethod = paymentMethods.data.find(
          (pm) => pm.id === subscription.defaultPaymentMethodId
        )

        if (!defaultPaymentMethod) {
          return paymentMethods.data.at(0)?.id
        }

        return defaultPaymentMethod.id
      }
    )

    if (!paymentMethodId) {
      throw new Error(`customer ${customerId} has no payment method`)
    }

    const invoiceId = await io.runTask(`create stripe invoice for ${customerId}`, async () =>
      stripe.invoices
        .create({
          customer: customerPaymentProviderId,
          default_payment_method: paymentMethodId,
          currency: subscription.planVersion.currency,
          auto_advance: false, // configure depending on the plan
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
              value: new Date(year, month - 1, 1).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              }),
            },
          ],
        })
        .then((invoice) => invoice.id)
    )

    io.logger.info("dates", {
      year,
      month,
      startDate: new Date(subscription.startDate),
      createdAt: new Date(subscription.createdAt),
    })

    // calculate the proration for the invoice
    // TODO: support plan changes
    let monthProrate: number | undefined = undefined
    if (
      subscription.startDate &&
      new Date(subscription.startDate).getUTCFullYear() === year &&
      new Date(subscription.startDate).getUTCMonth() === month
    ) {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1)
      monthProrate =
        (end.getTime() - new Date(subscription.startDate).getTime()) /
        (end.getTime() - start.getTime())

      io.logger.info("prorating", { start, end, monthProrate })
    }

    // create an invoice item for each feature
    for (const item of subscription.items) {
      let prorate = monthProrate

      // proration is supported for fixed cost items - not for usage
      if (item.featurePlanVersion.featureType === "usage") {
        prorate = undefined
      }

      let quantity = 0

      // get usage only for usage features - the rest are calculated from the subscription items
      if (item.featurePlanVersion.featureType !== "usage") {
        quantity = item.units! // all non usage features have a default quantity
      } else {
        quantity = await io.runTask(
          `get usage for ${item.featurePlanVersion.feature.slug}`,
          async () => {
            const usage = await tinybird
              .getUsageFeature({
                featureSlug: item.featurePlanVersion.feature.slug,
                projectId: subscription.projectId,
                customerId: customerId,
                start: new Date(year, month, 1).getTime(),
                end: new Date(year, month + 1).getTime(),
              })
              .then((usage) => usage.data[0])

            const units = usage ? usage[item.featurePlanVersion.aggregationMethod] || 0 : 0

            return units
          }
        )
      }

      io.logger.info(`usage is ${item.featurePlanVersion.feature.slug}`, {
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

      io.logger.info(`priceCalculation is ${item.featurePlanVersion.feature.slug}`, {
        amount,
        currency,
        feature: item.featurePlanVersion.feature.slug,
      })

      await createStripeCostInvoiceItem({
        stripe,
        invoiceId,
        io,
        stripeCustomerId: customerPaymentProviderId,
        name: item.featurePlanVersion.feature.slug,
        productId: item.featurePlanVersion.feature.id,
        amount: amount,
        quantity: quantity,
        currency: currency,
        isProrated: prorate !== undefined,
      })
    }

    return {
      invoiceId,
    }
  },
})

async function createStripeCostInvoiceItem({
  stripe,
  invoiceId,
  io,
  stripeCustomerId,
  name,
  productId,
  isProrated,
  amount,
  quantity,
  currency,
}: {
  stripe: Stripe
  invoiceId: string
  io: IO
  stripeCustomerId: string
  name: string
  productId: string
  amount: number
  currency: string
  quantity: number
  isProrated?: boolean
}): Promise<void> {
  // TODO: support proration
  await io.runTask(name, async () => {
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoiceId,
      quantity: quantity,
      price_data: {
        currency: currency,
        product: productId,
        unit_amount: amount,
      },
      currency: currency,
      description: isProrated ? `${name} (prorated)` : name,
    })
  })
}
