import { task } from "@trigger.dev/sdk/v3"
import { Stripe } from "@unprice/stripe"
import { env } from "../../env.mjs"

export const invoiceStripeItemsTask = task({
  id: "invoice.stripe.items",
  run: async ({
    customerPaymentProviderId,
    invoiceId,
    quantity,
    currency,
    prorate,
    productId,
    amount,
    productSlug,
  }: {
    customerPaymentProviderId: string
    invoiceId: string
    quantity: number
    currency: string
    prorate: number
    productId: string
    amount: number
    productSlug: string
  }) => {
    const stripe = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: "2023-10-16",
      typescript: true,
    })

    // create an invoice item for each feature
    await stripe.invoiceItems.create({
      customer: customerPaymentProviderId,
      invoice: invoiceId,
      quantity: quantity,
      price_data: {
        currency: currency,
        product: productId,
        unit_amount: amount,
      },
      currency: currency,
      description: prorate !== 1 ? `${productSlug} (prorated)` : productSlug,
    })
  },
})
