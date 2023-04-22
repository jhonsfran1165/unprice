import { Readable } from "node:stream"
import { NextApiRequest, NextApiResponse } from "next"
import Stripe from "stripe"

import { onCheckoutCompleted } from "@/lib/api/stripe"
import { PRO_TIERS } from "@/lib/config/subscriptions"
import { stripe } from "@/lib/stripe"
import supabaseAdmin from "@/lib/supabase/supabase-admin"
import { redis } from "@/lib/upstash"
import { getEnv, log } from "@/lib/utils"

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable: Readable) {
  const chunks: any[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

// https://stripe.com/docs/billing/subscriptions/overview#subscription-events
const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
])

export enum StripeWebhooks {
  AsyncPaymentSuccess = "checkout.session.async_payment_succeeded",
  Completed = "checkout.session.completed",
  PaymentFailed = "checkout.session.async_payment_failed",
  SubscriptionDeleted = "customer.subscription.deleted",
  SubscriptionUpdated = "customer.subscription.updated",
}

// TODO: work in progress - finish this when projects is done
export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST /api/projects/[slug]/upgrade/webhook – listen to Stripe webhooks
  if (req.method === "POST") {
    const buf = await buffer(req)
    const sig = req.headers["stripe-signature"]
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    let event: Stripe.Event
    try {
      if (!sig || !webhookSecret) return
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
    } catch (err: any) {
      console.log(`❌ Error message: ${err.message}`)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }
    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case StripeWebhooks.Completed:
            {
              const checkoutSession = event.data
                .object as Stripe.Checkout.Session

              // when the user subscribes to a plan, set their stripe customer ID
              // in the database for easy identification in future webhook events
              const orgId = checkoutSession.client_reference_id
              const subscriptionId =
                checkoutSession?.subscription?.toString() || ""
              const stripeId = checkoutSession.customer?.toString()

              await onCheckoutCompleted({
                orgId,
                subscriptionId,
                stripeId,
              })
            }
            break

            // case StripeWebhooks.SubscriptionUpdated:
            //   {
            //     const subscriptionUpdated = event.data
            //       .object as Stripe.Subscription
            //     const newPriceId = subscriptionUpdated.items.data[0].price.id
            //     const env = getEnv()
            //     const tier = PRO_TIERS.find(
            //       (tier) =>
            //         tier.price.monthly.priceIds[env] === newPriceId ||
            //         tier.price.yearly.priceIds[env] === newPriceId
            //     )
            //     const usageLimit = tier?.quota
            //     const stripeId = subscriptionUpdated.customer.toString()

            //     // If a user upgrades/downgrades their subscription, update their usage limit in the database.
            //     // We also need to update the ownerUsageLimit field for all their projects.

            //     const { projects } = await prisma.user.findUnique({
            //       where: {
            //         stripeId,
            //       },
            //       select: {
            //         projects: {
            //           where: {
            //             role: "owner",
            //           },
            //           select: {
            //             projectId: true,
            //           },
            //         },
            //       },
            //     })

            //     await Promise.all([
            //       prisma.user.update({
            //         where: {
            //           stripeId,
            //         },
            //         data: {
            //           usageLimit,
            //           billingCycleStart: new Date().getDate(),
            //         },
            //       }),
            //       Promise.all(
            //         projects.map(async ({ projectId }) => {
            //           return await prisma.project.update({
            //             where: {
            //               id: projectId,
            //             },
            //             data: {
            //               ownerUsageLimit: usageLimit,
            //             },
            //           })
            //         })
            //       ),
            //     ])
            //   }
            break
          default:
            throw new Error("Unhandled relevant event!")
        }

        // else if (event.type === "customer.subscription.deleted") {
        //   const subscriptionDeleted = event.data.object as Stripe.Subscription

        //   const stripeId = subscriptionDeleted.customer.toString()

        //   // If a user deletes their subscription, reset their usage limit in the database to 1000.
        //   // We also need to reset the ownerUsageLimit field for all their projects to 1000.

        //   const { email, usage, projects } = await prisma.user.findUnique({
        //     where: {
        //       stripeId,
        //     },
        //     select: {
        //       email: true,
        //       usage: true,
        //       projects: {
        //         where: {
        //           role: "owner",
        //         },
        //         select: {
        //           projectId: true,
        //           project: {
        //             select: {
        //               domain: true,
        //             },
        //           },
        //         },
        //       },
        //     },
        //   })

        //   const response = await Promise.all([
        //     prisma.user.update({
        //       where: {
        //         stripeId,
        //       },
        //       data: {
        //         usageLimit: 1000,
        //       },
        //     }),
        //     Promise.all(
        //       projects.map(async ({ projectId, project: { domain } }) => {
        //         return await Promise.all([
        //           prisma.project.update({
        //             where: {
        //               id: projectId,
        //             },
        //             data: {
        //               ownerUsageLimit: 1000,
        //               ownerExceededUsage: usage > 1000,
        //             },
        //           }),
        //           redis.del(`root:${domain}`), // remove root domain redirect
        //         ])
        //       })
        //     ),
        //     log(
        //       ":cry: User *`" + email + "`* deleted their subscription",
        //       "links"
        //     ),
        //   ])
        //   console.log(response)
        // } else {
        //   throw new Error("Unhandled relevant event!")
        // }
      } catch (error) {
        console.log(error)
        return res
          .status(400)
          .send(`Webhook error: Webhook handler failed. ${error}`)
      }
    } else {
      return res.status(400).send(`🤷‍♀️ Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } else {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
