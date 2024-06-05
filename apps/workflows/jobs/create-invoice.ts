import { Tinybird } from "@/lib/tinybird"
import {
  type FixedSubscription,
  type TieredSubscription,
  calculateTieredPrices,
} from "@unkey/billing"
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
    const tinybird = new Tinybird(env().TINYBIRD_TOKEN)

    const customer = await io.runTask(`get customer ${customerId}`, async () =>
      db.query.customers.findFirst({
        with: {
          paymentMethods: true,
          subscriptions: {
            where: (sub, { eq }) => eq(sub.id, subscriptionId),
          },
        },
        where: (table, { and, eq, isNull }) => and(eq(table.id, customerId), isNull(table.active)),
      })
    )

    if (!customer) {
      throw new Error(`customer ${customerId} not found`)
    }

    if (!customer.stripeCustomerId) {
      throw new Error(`customer ${customerId} has no stripe customer id`)
    }

    if (!customer.subscriptions?.at(0)) {
      throw new Error(`customer ${customerId} has no subscription`)
    }

    const defaultPaymentMethodId =
      customer.subscriptions.at(0)?.metadata?.defaultPaymentMethodId ??
      customer.paymentMethods.at(0)?.paymentMethodId

    if (!defaultPaymentMethodId) {
      throw new Error(`customer ${customerId} has no default payment method`)
    }

    const paymentMethodId = await io.runTask(
      `get payment method for subscription ${subscriptionId}`,
      async () => {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer.stripeCustomerId!,
          limit: 3,
        })

        const defaultPaymentMethod = paymentMethods.data.filter(
          (pm) => pm.id === defaultPaymentMethodId
        )[0]

        if (!defaultPaymentMethod) {
          throw new Error(`customer ${customerId} has no default payment method`)
        }

        return defaultPaymentMethod.id
      }
    )

    const invoiceId = await io.runTask(`create invoice for ${customer.id}`, async () =>
      stripe.invoices
        .create({
          customer: customer.stripeCustomerId!,
          default_payment_method: paymentMethodId,
          auto_advance: false,
          custom_fields: [
            {
              name: "Customer",
              value: customer.name,
            },
            {
              name: "Email",
              value: customer.email,
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

    await createFixedCostInvoiceItem({
      stripe,
      invoiceId,
      stripeCustomerId: customer.stripeCustomerId!,
      io,
      name: "Verifications",
      sub: customer.subscriptions.at(0),
    })

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
  sub,
  prorate,
}: {
  stripe: Stripe
  invoiceId: string
  io: IO
  stripeCustomerId: string
  name: string
  sub: FixedSubscription
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
        currency: "usd",
        product: sub.productId,
        unit_amount_decimal:
          typeof prorate === "number"
            ? (Number.parseInt(sub.cents) * prorate).toFixed(2)
            : sub.cents,
      },
      currency: "usd",
      description: typeof prorate === "number" ? `${name} (Prorated)` : name,
    })
  })
}
