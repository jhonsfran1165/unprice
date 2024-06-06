import { z } from "zod"

import { env } from "@/lib/env"
import { client } from "@/trigger"

import { connectDatabase } from "@/lib/db"
import { type IO, eventTrigger } from "@trigger.dev/sdk"

import Stripe from "stripe"

export const createInvoiceJob = client.defineJob({
  id: "billing.invoicing.createInvoice",
  name: "Collect usage and create invoice",
  version: "0.0.1",
  trigger: eventTrigger({
    name: "billing.invoicing.createInvoice",
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
    // const tinybird = new Tinybird(env().TINYBIRD_TOKEN)

    const subscription = await io.runTask(`get subscription ${subscriptionId}`, async () =>
      db.query.subscriptions.findFirst({
        with: {
          customer: true,
          features: {
            with: {
              featurePlan: true,
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

    const provider = subscription.planVersion.paymentProvider
    let customerPaymentProviderId = ""

    switch (provider) {
      case "stripe": {
        customerPaymentProviderId = subscription.customer.stripeCustomerId ?? ""
        break
      }
      case "lemonsqueezy": {
        // TODO: change this to the correct customer id
        customerPaymentProviderId = subscription.customer.stripeCustomerId ?? ""
        break
      }
      default: {
        throw new Error(`unknown payment provider ${provider}`)
      }
    }

    if (customerPaymentProviderId === "") {
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

    // TODO: this should handle only stripe
    const invoiceId = await io.runTask(`create invoice for ${customerId}`, async () =>
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

    // create an invoice item for each feature
    for (const feature of subscription.features) {
      await createFixedCostInvoiceItem({
        stripe,
        invoiceId,
        io,
        stripeCustomerId: customerPaymentProviderId,
        name: feature.featureSlug,
        productId: feature.featurePlan.metadata?.stripeProductId ?? "",
        amount: feature.featurePlan.config?.price?.displayAmount ?? "0",
        currency: subscription.planVersion.currency,
      })
    }

    return {
      invoiceId,
    }
  },
})

async function createFixedCostInvoiceItem({
  stripe,
  invoiceId,
  io,
  stripeCustomerId,
  name,
  productId,
  prorate,
  amount,
  currency,
}: {
  stripe: Stripe
  invoiceId: string
  io: IO
  stripeCustomerId: string
  name: string
  productId: string
  amount: string
  currency: "USD" | "EUR"
  /**
   * number between 0 and 1 to indicate how much to charge
   * if they have had a fixed cost item for 15/30 days, this should be 0.5
   */
  prorate?: number
}): Promise<void> {
  await io.runTask(name, async () => {
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoiceId,
      quantity: 1,
      price_data: {
        currency: currency,
        product: productId,
        unit_amount_decimal: amount,
      },
      currency: currency,
      description: typeof prorate === "number" ? `${name} (Prorated)` : name,
    })
  })
}
