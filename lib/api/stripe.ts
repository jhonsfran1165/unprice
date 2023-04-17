import Stripe from "stripe"

import { stripe } from "@/lib/stripe"
// we need to override RLS here, for that we use supabase admin
import supabaseAdmin from "@/lib/supabase/supabase-admin"
import {
  OrganizationSubscriptionInterval,
  OrganizationSubscriptionStatus,
  OrganizationSubscriptions,
} from "@/lib/types/supabase"
import { toDateTime } from "@/lib/utils"

const buildSubscriptionData = (
  subscription: Stripe.Subscription,
  orgId: number
): OrganizationSubscriptions => {
  const subscriptionData: OrganizationSubscriptions = {
    id: subscription.id,
    org_id: orgId,
    metadata: subscription.metadata,
    status: subscription.status as OrganizationSubscriptionStatus,
    price_id: subscription.items.data[0].price.id,
    // TODO: check quantity on subscription
    // @ts-ignore
    quantity: subscription.quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at).toISOString()
      : null,
    current_period_start: toDateTime(
      subscription.current_period_start
    ).toISOString(),
    current_period_end: toDateTime(
      subscription.current_period_end
    ).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at
      ? toDateTime(subscription.ended_at).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end).toISOString()
      : null,
    currency: subscription.currency,
    interval: subscription.items.data[0].price.recurring
      ?.interval as OrganizationSubscriptionInterval,
    interval_count:
      subscription.items.data[0].price.recurring?.interval_count ?? null,
  }

  return subscriptionData
}

const onCheckoutCompleted = async ({
  subscriptionId,
  stripeId,
  orgId,
}: {
  subscriptionId: string
  stripeId?: string
  orgId: string | null
}) => {
  const { data: orgData, error: noOrgError } = await supabaseAdmin
    .from("organization")
    .select("id, stripe_id")
    .eq("id", orgId)
    .single()
  if (noOrgError) throw noOrgError

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  })

  // status can either be PAID or AWAITING_PAYMENT (if asynchronous)
  // TODO: validate this
  const status = subscription.status as OrganizationSubscriptionStatus
  // TODO: change id to string for organization
  const subscriptionData = buildSubscriptionData(
    subscription,
    parseInt(orgId || "")
  )

  // TODO: validate if there is a stripe id
  if (orgData.stripe_id && orgData.stripe_id !== stripeId)
    throw "stripeId is no the same"

  const result = await Promise.all([
    supabaseAdmin
      .from("organization")
      .update({
        stripe_id: stripeId,
      })
      .eq("id", orgId),
    supabaseAdmin.from("organization_subscriptions").insert(subscriptionData),
  ])

  console.log(result)
  // if (error) throw error
  // console.log(
  //   `Inserted/updated subscription [${subscription.id}] for organization [${orgId}]`
  // )
}

export { onCheckoutCompleted }
