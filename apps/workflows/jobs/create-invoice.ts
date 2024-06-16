import { connectDatabase } from "@/lib/db"
import { env } from "@/lib/env"
import { client } from "@/trigger"
import { configFlatSchema, configUsageSchema } from "@builderai/db/validators"
import { Analytics } from "@builderai/tinybird"
import { type IO, eventTrigger } from "@trigger.dev/sdk"
import { dinero, multiply, toDecimal, trimScale } from "dinero.js"
import { z } from "zod"

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
    for (const item of subscription.items) {
      const usage = await io.runTask(
        `get usage for ${item.featurePlanVersion.feature.slug}`,
        async () => {
          const usage = await tinybird
            .getUsageFeature({
              featureSlug: item.featurePlanVersion.feature.slug,
              customerId: customerId,
              start: new Date(year, month, 1).getTime(),
              end: new Date(year, month + 1, 0).getTime(),
            })
            .then((usage) => usage.data[0])

          console.log(usage)

          return usage
        }
      )

      // calculate the price depending on the type of feature
      switch (item.featurePlanVersion.featureType) {
        case "usage": {
          const usageConfig = configUsageSchema.parse(item.featurePlanVersion.config)
          const usagePrice = dinero(usageConfig.price.dinero)
          const aggregationMethod = usageConfig.aggregationMethod
          const featureUsage = usage[aggregationMethod]
          const total = toDecimal(trimScale(multiply(usagePrice, featureUsage)))

          console.log(total)
          console.log(usagePrice)

          await createFixedCostInvoiceItem({
            stripe,
            invoiceId,
            io,
            stripeCustomerId: customerPaymentProviderId,
            name: item.featurePlanVersion.feature.slug,
            productId: item.featurePlanVersion.feature.id,
            amount: total ?? "0",
            currency: subscription.planVersion.currency,
          })

          break
        }
        case "flat": {
          const flatConfig = configFlatSchema.parse(item.featurePlanVersion.config)
          const price = dinero(flatConfig.price.dinero)
          const total = toDecimal(trimScale(price))

          await createFixedCostInvoiceItem({
            stripe,
            invoiceId,
            io,
            stripeCustomerId: customerPaymentProviderId,
            name: item.featurePlanVersion.feature.slug,
            productId: item.featurePlanVersion.feature.id,
            amount: total ?? "0",
            currency: subscription.planVersion.currency,
          })
          break
        }
        case "package":
        case "tier": {
          await createFixedCostInvoiceItem({
            stripe,
            invoiceId,
            io,
            stripeCustomerId: customerPaymentProviderId,
            name: item.featurePlanVersion.feature.slug,
            productId: item.featurePlanVersion.feature.id,
            amount: "0.00",
            currency: subscription.planVersion.currency,
          })
          break
        }
        default: {
          throw new Error(`unknown feature type ${item.featurePlanVersion.featureType}`)
        }
      }
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
