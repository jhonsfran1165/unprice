import { APP_DOMAIN } from "@unprice/config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { endOfMonth, startOfMonth } from "date-fns"
import { Fragment } from "react"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

import type { RouterOutputs } from "@unprice/api"
import { calculateBillingCycle } from "@unprice/db/validators"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { BillingCard } from "./_components/billing"

export default async function BillingPage({ params }: { params: { workspaceSlug: string } }) {
  const { workspaceSlug } = params

  const { subscriptions } = await api.auth.mySubscriptions()

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
        <SubscriptionCard subscriptions={subscriptions} />
        <PaymentMethodCard workspaceSlug={workspaceSlug} subscriptions={subscriptions} />
        <UsageCard />
      </Fragment>
    </DashboardShell>
  )
}

async function PaymentMethodCard({
  workspaceSlug,
  subscriptions,
}: {
  workspaceSlug: string
  subscriptions: RouterOutputs["auth"]["mySubscriptions"]["subscriptions"]
}) {
  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]

  // TODO: handle case where no subscription is found
  if (!subscription) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
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

async function SubscriptionCard({
  subscriptions,
}: {
  subscriptions: RouterOutputs["auth"]["mySubscriptions"]["subscriptions"]
}) {
  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]

  // TODO: handle case where no subscription is found
  if (!subscription) return null

  const autoRenewal = subscription.autoRenew
  const trialDays = subscription.trialDays
  const trialEndsAt = subscription.trialEndsAt
  const endDateAt = subscription.endDateAt
  const isProrated = subscription.prorated

  const calculatedBillingCycle = calculateBillingCycle(
    new Date(subscription.startDateAt),
    subscription.startCycle ?? 1,
    subscription.planVersion.billingPeriod ?? "month"
  )

  /**
   * if the customer is in trial days, we need to show the trial days left and when the trial ends
   * if the customer is not in trial days and the plan is not auto renewing, we need to show the next billing date and when the subscription ends
   * if the plan is auto renewing, we need to show the next billing date
   */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Info</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-4">
            <div className="font-semibold text-lg">
              {trialDays > 0 ? "Trial" : "Subscription"} Plan:{" "}
              <span className="text-primary">{subscription.planVersion.plan.slug}</span>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">Current Billing Cycle</h4>
              <p>
                {formatDate(
                  calculatedBillingCycle.cycleStart.getTime(),
                  subscription.timezone,
                  "MMM d, yyyy"
                )}{" "}
                -{" "}
                {formatDate(
                  calculatedBillingCycle.cycleEnd.getTime(),
                  subscription.timezone,
                  "MMM d, yyyy"
                )}
              </p>
              <p>
                subscription start date:{" "}
                {formatDate(subscription.startDateAt, subscription.timezone, "MMM d, yyyy")}
              </p>
              <p>
                next billing date:{" "}
                {formatDate(
                  subscription.nextBillingAt ?? calculatedBillingCycle.cycleEnd.getTime(),
                  subscription.timezone,
                  "MMM d, yyyy"
                )}
              </p>
            </div>
            {trialEndsAt && (
              <div className="rounded-lg bg-yellow-100 p-4 text-yellow-800">
                <h4 className="mb-2 font-medium">Trial Period</h4>
                <p>
                  {trialDays} days trial ends on{" "}
                  {formatDate(trialEndsAt, subscription.timezone, "MMM d, yyyy")}
                </p>
              </div>
            )}
            {endDateAt && (
              <div className="rounded-lg bg-blue-100 p-4 text-blue-800">
                <h4 className="mb-2 font-medium">Subscription End Date</h4>
                <p>{formatDate(endDateAt, subscription.timezone, "MMM d, yyyy")}</p>
              </div>
            )}
            {autoRenewal && (
              <div className="rounded-lg bg-green-100 p-4 text-green-800">
                <p>Your subscription will automatically renew at the end of the billing cycle.</p>
              </div>
            )}
            {isProrated && (
              <div className="rounded-lg bg-purple-100 p-4 text-purple-800">
                <p>Your subscription is prorated based on your start date.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="font-semibold text-gray-700 text-xl">
              You are not subscribed to any plan.
            </p>
            <p className="mt-2 text-gray-500">Choose a plan to get started with our services.</p>
          </div>
        )}
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
