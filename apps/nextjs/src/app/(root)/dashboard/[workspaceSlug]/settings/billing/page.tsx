import { APP_DOMAIN } from "@unprice/config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { addMonths, addYears, endOfMonth, startOfMonth } from "date-fns"
import { Fragment } from "react"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { BillingCard } from "./_components/billing"

export default function BillingPage({ params }: { params: { workspaceSlug: string } }) {
  const { workspaceSlug } = params

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Billing Settings"
          description="Manage your payments for this workspace."
        />
      }
    >
      <Fragment>
        <SubscriptionCard workspaceSlug={workspaceSlug} />
        <UsageCard />
      </Fragment>
    </DashboardShell>
  )
}

async function SubscriptionCard({ workspaceSlug }: { workspaceSlug: string }) {
  const { subscriptions } = await api.auth.mySubscriptions()

  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]

  // TODO: handle case where no subscription is found
  if (!subscription) return null

  // TODO: handle the case when the subscription comes from the main workspace

  const nextBillingDate =
    subscription.planVersion.billingPeriod === "month"
      ? addMonths(new Date(subscription.startDateAt), 1).getTime()
      : addYears(new Date(subscription.startDateAt), 1).getTime()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div>
            You are currently on the <strong>{subscription.planVersion.plan.slug}</strong> plan.
            {subscription.startDateAt && (
              <strong>Your subscription will renew on {formatDate(nextBillingDate)}</strong>
            )}
          </div>
        ) : (
          <div>You are not subscribed to any plan.</div>
        )}
        <PaymentMethodForm
          customerId={subscription.customerId}
          successUrl={`${APP_DOMAIN}/${workspaceSlug}/settings/billing`}
          cancelUrl={`${APP_DOMAIN}/${workspaceSlug}/settings/billing`}
          projectSlug="unprice-admin"
          readonly={true}
        />
      </CardContent>
      <CardFooter />
    </Card>
  )
}

async function UsageCard() {
  const { subscriptions } = await api.auth.mySubscriptions()

  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]
  const planVersion = subscription?.planVersion

  // TODO: handle case where no subscription is found
  if (!subscription || !planVersion) return null

  const { featuresWithUsage } = await api.analytics.getUsageCustomerUnprice({
    customerId: subscription.customerId,
    start: startOfMonth(new Date()).getTime(),
    end: endOfMonth(new Date()).getTime(),
  })

  return <BillingCard subscriptions={subscriptions} featuresWithUsage={featuresWithUsage} />
}
