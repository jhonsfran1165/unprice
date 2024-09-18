import { APP_DOMAIN } from "@unprice/config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { differenceInCalendarDays, endOfMonth, startOfMonth } from "date-fns"
import { Fragment } from "react"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

import type { RouterOutputs } from "@unprice/api"
import { Alert, AlertDescription, AlertTitle } from "@unprice/ui/alert"
import { Button } from "@unprice/ui/button"
import { Typography } from "@unprice/ui/typography"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { BillingCard } from "./_components/billing"
import { UpgradeDialog } from "./_components/upgrade-dialog"

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
  const trialEndsAt = subscription.trialEndsAt
  const endAt = subscription.endAt
  const isProrated = subscription.prorated
  const currentTrialDays = subscription.trialEndsAt
    ? differenceInCalendarDays(subscription.trialEndsAt, Date.now())
    : 0

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
            <div className="flex items-center justify-between">
              <div className="font-semibold text-md">
                {currentTrialDays > 0 ? "Trial" : "Subscription"} Plan:{" "}
                <span className="text-primary">{subscription.planVersion.plan.slug}</span>
              </div>

              {!subscription.planVersion.plan.defaultPlan && (
                <UpgradeDialog
                  defaultValues={{
                    id: subscription.id,
                    endAt: Date.now(),
                    customerId: subscription.customerId,
                    nextPlanVersionId: "",
                    config: [],
                    projectId: subscription.projectId,
                  }}
                >
                  <Button variant="destructive" size="sm">
                    Change Plan
                  </Button>
                </UpgradeDialog>
              )}

              {subscription.planVersion.plan.defaultPlan && (
                <UpgradeDialog
                  defaultValues={{
                    id: subscription.id,
                    endAt: Date.now(),
                    customerId: subscription.customerId,
                    nextPlanVersionId: "",
                    config: [],
                    projectId: subscription.projectId,
                  }}
                >
                  <Button variant="primary" size="sm">
                    Upgrade Plan
                  </Button>
                </UpgradeDialog>
              )}
            </div>
            <div className="gap-2 rounded-lg bg-background-bg p-4">
              <Typography variant="h6">Current Billing Cycle</Typography>
              <Typography variant="p">
                {formatDate(subscription.currentCycleStartAt, subscription.timezone, "MMM d, yyyy")}{" "}
                - {formatDate(subscription.currentCycleEndAt, subscription.timezone, "MMM d, yyyy")}
              </Typography>
              <div className="flex flex-col py-4">
                <Typography variant="p" affects="removePaddingMargin">
                  <span className="font-bold">
                    Your subscription {subscription.startAt > Date.now() ? "will start" : "started"}{" "}
                    at:
                  </span>{" "}
                  {formatDate(subscription.startAt, subscription.timezone, "MMM d, yyyy")}
                </Typography>
                <Typography variant="p" affects="removePaddingMargin">
                  <span className="font-bold">Next billing date:</span>{" "}
                  {formatDate(subscription.currentCycleEndAt, subscription.timezone, "MMM d, yyyy")}
                </Typography>
              </div>
            </div>
            {currentTrialDays > 0 && trialEndsAt && (
              <Alert>
                <AlertTitle>Trial Period</AlertTitle>
                <AlertDescription>
                  {currentTrialDays} days trial ends on{" "}
                  {formatDate(trialEndsAt, subscription.timezone, "MMM d, yyyy")}
                </AlertDescription>
              </Alert>
            )}
            {endAt && (
              <Alert variant="destructive">
                <AlertTitle>Subscription End Date</AlertTitle>
                <AlertDescription>
                  {formatDate(endAt, subscription.timezone, "MMM d, yyyy")}
                </AlertDescription>
              </Alert>
            )}
            {autoRenewal && (
              <Alert>
                <AlertTitle>Subscription Will Auto Renew</AlertTitle>
                <AlertDescription>
                  Your subscription will automatically renew at{" "}
                  {formatDate(subscription.currentCycleEndAt, subscription.timezone, "MMM d, yyyy")}
                </AlertDescription>
              </Alert>
            )}
            {isProrated && (
              <Alert>
                <AlertTitle>Subscription Is Prorated</AlertTitle>
                <AlertDescription>
                  Your subscription is prorated because it was created in the middle of the billing
                  cycle.
                </AlertDescription>
              </Alert>
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
