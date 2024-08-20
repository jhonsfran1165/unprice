import type Stripe from "stripe"

import { db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"

import { stripe } from "."

export async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (typeof session.subscription !== "string") {
        throw new Error("Missing or invalid subscription id")
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription)

      const _stripeId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
      const { userId } = subscription.metadata

      if (!userId) {
        throw new Error("Missing user id")
      }

      // stripeId is unique so we can rely on that to filter the right workspace and user

      // const subscriptionPlan = stripePriceToSubscriptionPlan(
      //   subscription.items.data[0]?.price.id
      // )

      // TODO: this will change when we have a proper plan system in place
      /**
       * User is already subscribed, update their info
       */

      /**
       * User is not subscribed, create a new customer and workspace
       */
      // TODO: should be able to retry if the slug already exists
      const workspaceId = utils.newId("workspace")

      // TODO: create workspace

      // create membership
      await db.insert(schema.members).values({
        userId,
        workspaceId,
        role: "OWNER",
      })

      break
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object
      if (typeof invoice.subscription !== "string") {
        throw new Error("Missing or invalid subscription id")
      }

      break
    }
    case "invoice.payment_failed": {
      // TODO: Handle failed payments
      break
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const stripeId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id

      await db
        .update(schema.workspaces)
        .set({
          isPersonal: true,
        })
        .where(eq(schema.workspaces.unPriceCustomerId, stripeId))

      break
    }
    case "customer.subscription.updated": {
      // const subscriptionPlan = stripePriceToSubscriptionPlan(
      //   subscription.items.data[0]?.price.id
      // )

      break
    }

    default: {
      return
    }
  }
}
