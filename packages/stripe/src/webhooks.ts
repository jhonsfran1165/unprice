import type Stripe from "stripe"

import { clerkClient } from "@builderai/auth"
import { stripePriceToSubscriptionPlan } from "@builderai/config"
import { db, eq } from "@builderai/db"
import { workspace } from "@builderai/db/schema/workspace"
import { generateSlug, workspaceIdFromTenantId } from "@builderai/db/utils"

import { stripe } from "."

export async function handleEvent(event: Stripe.DiscriminatedEvent) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (typeof session.subscription !== "string") {
        throw new Error("Missing or invalid subscription id")
      }
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      )

      const stripeId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id
      const { userId, organizationName } = subscription.metadata

      if (!userId) {
        throw new Error("Missing user id")
      }

      // stripeId is unique so we can rely on that to filter the right workspace and user
      const workspaceData = await db.query.workspace.findFirst({
        columns: {
          id: true,
        },
        where: (workspace, { eq, and }) =>
          and(eq(workspace.stripeId, stripeId)),
      })

      const subscriptionPlan = stripePriceToSubscriptionPlan(
        subscription.items.data[0]?.price.id
      )

      /**
       * User is already subscribed, update their info
       */
      if (workspaceData) {
        return await db
          .update(workspace)
          .set({
            subscriptionId: subscription.id,
            billingPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan: subscriptionPlan?.key,
          })
          .where(eq(workspace.id, workspaceData.id))
      }

      /**
       * User is not subscribed, create a new customer and org
       */
      const orgSlug = generateSlug(2)
      const organization = await clerkClient.organizations.createOrganization({
        createdBy: userId,
        name: organizationName ?? orgSlug,
        slug: orgSlug,
      })

      const workspaceId = workspaceIdFromTenantId(organization.id)

      await db.insert(workspace).values({
        id: workspaceId,
        stripeId,
        subscriptionId: subscription.id,
        plan: subscriptionPlan?.key,
        tenantId: organization.id,
        billingPeriodStart: new Date(subscription.current_period_start * 1000),
        billingPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnds:
          subscription.status === "trialing" && subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
        slug: organization.slug ?? orgSlug,
        name: organization.name,
      })
      break
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object
      if (typeof invoice.subscription !== "string") {
        throw new Error("Missing or invalid subscription id")
      }
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      )

      const subscriptionPlan = stripePriceToSubscriptionPlan(
        subscription.items.data[0]?.price.id
      )

      await db
        .update(workspace)
        .set({
          billingPeriodEnd: new Date(subscription.current_period_end * 1000),
          plan: subscriptionPlan?.key,
        })
        .where(eq(workspace.subscriptionId, subscription.id))

      break
    }
    case "invoice.payment_failed": {
      // TODO: Handle failed payments
      break
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const stripeId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id

      await db
        .update(workspace)
        .set({
          subscriptionId: null,
          plan: "FREE",
          billingPeriodEnd: null,
        })
        .where(eq(workspace.stripeId, stripeId))

      break
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object
      const stripeId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id

      const subscriptionPlan = stripePriceToSubscriptionPlan(
        subscription.items.data[0]?.price.id
      )

      await db
        .update(workspace)
        .set({
          plan: subscriptionPlan?.key,
          billingPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
        .where(eq(workspace.stripeId, stripeId))

      break
    }

    default: {
      console.log("🆗 Stripe Webhook Unhandled Event Type: ", event.type)
      return
    }
  }

  console.log("✅ Stripe Webhook Processed")
}
