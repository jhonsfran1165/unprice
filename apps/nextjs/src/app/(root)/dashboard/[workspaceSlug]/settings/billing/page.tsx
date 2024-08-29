import { APP_DOMAIN } from "@unprice/config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { addMonths, endOfMonth, startOfMonth } from "date-fns"
import { Fragment } from "react"
import { ProgressDemo } from "~/components/analytics/progress"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div>
            You are currently on the <strong>{subscription.planVersion.title}</strong> plan.
            {subscription.startDateAt && (
              <strong>
                Your subscription will renew on{" "}
                {/* TODO: improve this because subscription can be monthly or yearly
                  and we should display the correct date in the correct format
                */}
                {addMonths(new Date(formatDate(subscription.startDateAt)), 1).toLocaleDateString()}
              </strong>
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
        />
      </CardContent>
      <CardFooter />
    </Card>
  )
}

async function UsageCard() {
  const { usage } = await api.analytics.getTotalUsagePerFeatureActiveProject({
    start: startOfMonth(new Date()).getTime(),
    end: endOfMonth(new Date()).getTime(),
  })

  console.info(usage)
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressDemo />
      </CardContent>
    </Card>
  )
}
