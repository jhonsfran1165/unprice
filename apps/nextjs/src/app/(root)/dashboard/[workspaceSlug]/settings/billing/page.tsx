import { APP_DOMAIN } from "@unprice/config"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { differenceInCalendarDays } from "date-fns"
import { Fragment } from "react"
import { PaymentMethodForm } from "~/components/forms/payment-method-form"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

import type { RouterOutputs } from "@unprice/trpc"
import { Alert, AlertDescription, AlertTitle } from "@unprice/ui/alert"
import { Badge } from "@unprice/ui/badge"
import { Button } from "@unprice/ui/button"
import { Typography } from "@unprice/ui/typography"
import { AlertCircle } from "lucide-react"
import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { SubscriptionChangePlanDialog } from "../../[projectSlug]/customers/_components/subscriptions/subscription-change-plan-dialog"
import { BillingCard } from "./_components/billing"

export default async function BillingPage({ params }: { params: { workspaceSlug: string } }) {
  const { workspaceSlug } = params

  const { subscriptions, customerId } = await api.auth.mySubscriptions()

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
        <PaymentMethodCard workspaceSlug={workspaceSlug} customerId={customerId} />
        <UsageCard />
      </Fragment>
    </DashboardShell>
  )
}

async function PaymentMethodCard({
  workspaceSlug,
  customerId,
}: {
  workspaceSlug: string
  customerId: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentMethodForm
          customerId={customerId}
          successUrl={`${APP_DOMAIN}/${workspaceSlug}/settings/billing`}
          cancelUrl={`${APP_DOMAIN}/${workspaceSlug}/settings/billing`}
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
  // TODO: customer can only have one subscription for now
  const subscription = subscriptions[0]

  if (!subscription) {
    return (
      <Alert variant="info">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Subscription</AlertTitle>
        <AlertDescription className="font-extralight">
          You don't have any subscriptions yet or subscription is inactive.
        </AlertDescription>
      </Alert>
    )
  }

  const activePhase = subscription.phases.find((phase) => {
    const now = Date.now()
    return phase.startAt <= now && (phase.endAt ? phase.endAt >= now : true)
  })

  if (!activePhase) return null

  const autoRenewal = activePhase.planVersion.autoRenew
  const trialEndsAt = activePhase.trialEndsAt
  const currentTrialDays = activePhase.trialEndsAt
    ? differenceInCalendarDays(activePhase.trialEndsAt, Date.now())
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
                <span className="inline-flex items-center gap-1 text-primary">
                  <span className="font-bold text-primary">{subscription.planSlug}</span>
                  {autoRenewal && (
                    <Badge className="text-xs" variant="default">
                      auto-renew
                    </Badge>
                  )}
                </span>
                <Typography variant="p" affects="removePaddingMargin">
                  {activePhase.planVersion.description}
                </Typography>
              </div>

              <div className="flex items-center gap-2">
                <SubscriptionChangePlanDialog
                  defaultValues={{
                    id: subscription.id,
                    planVersionId: "",
                    config: [],
                    whenToChange: "end_of_cycle",
                    currentCycleEndAt: subscription.currentCycleEndAt,
                    timezone: subscription.timezone,
                    projectId: subscription.projectId,
                    currentPlanVersionId: activePhase.planVersion.id,
                  }}
                >
                  <Button size="sm">Change Plan</Button>
                </SubscriptionChangePlanDialog>
              </div>
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
                    Your subscription {activePhase.startAt > Date.now() ? "will start" : "started"}{" "}
                    at:
                  </span>{" "}
                  {formatDate(activePhase.startAt, subscription.timezone, "MMM d, yyyy")}
                </Typography>
                <Typography variant="p" affects="removePaddingMargin">
                  <span className="font-bold">Next billing date:</span>{" "}
                  {formatDate(subscription.invoiceAt, subscription.timezone, "MMM d, yyyy")}
                </Typography>
              </div>
            </div>
            {currentTrialDays > 0 && trialEndsAt && (
              <Alert>
                <AlertTitle>Trial Period</AlertTitle>
                <AlertDescription>
                  {activePhase.trialDays} days trial ends on{" "}
                  {formatDate(trialEndsAt, subscription.timezone, "MMM d, yyyy")}
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
  // for now only care the first one
  const subscription = subscriptions[0]

  if (!subscription) return null

  const activePhase = subscription.phases.find((phase) => {
    const now = Date.now()
    return phase.startAt <= now && (phase.endAt ? phase.endAt >= now : true)
  })

  // TODO: handle case where no active phase is found
  if (!activePhase)
    return (
      <Alert variant="info">
        <AlertTitle>No Active Phase</AlertTitle>
        <AlertDescription>You don't have any active phases for this subscription.</AlertDescription>
      </Alert>
    )

  const { entitlements } = await api.analytics.getUsageActiveEntitlementsCustomerUnprice({
    customerId: subscription.customerId,
  })

  return (
    <BillingCard
      subscription={subscription}
      entitlements={entitlements}
      activePhase={activePhase}
    />
  )
}
