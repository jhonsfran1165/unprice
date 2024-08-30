import type { RouterOutputs } from "@unprice/api"
import { APP_DOMAIN } from "@unprice/config"
import { calculateFlatPricePlan, calculatePricePerFeature } from "@unprice/db/validators"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { cn } from "@unprice/ui/utils"
import { addMonths, endOfMonth, startOfMonth } from "date-fns"
import { Fragment } from "react"
import { ProgressBar } from "~/components/analytics/progress"
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
            You are currently on the <strong>{subscription.planVersion.plan.slug}</strong> plan.
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
  const { subscriptions } = await api.auth.mySubscriptions()

  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]
  const planVersion = subscription?.planVersion

  // TODO: handle case where no subscription is found
  if (!subscription || !planVersion) return null

  const { err, val: totalPricePlan } = calculateFlatPricePlan({
    planVersion,
  })

  if (err) {
    return <div className="text-red-500">{err.message}</div>
  }

  const { usage } = await api.analytics.getUsageCustomer({
    start: startOfMonth(new Date()).getTime(),
    end: endOfMonth(new Date()).getTime(),
    customerId: subscription.customerId,
  })

  // TODO: improve this
  const features = await Promise.all(
    usage
      .filter((u) => !["flat", "package"].includes(u.featureType))
      .map(async (u) => {
        const { planVersionFeature } = await api.planVersionFeatures.getById({
          id: u.featureId,
        })

        return {
          usage: u,
          ...planVersionFeature,
        }
      })
  )

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <div className="text-content-subtle text-sm">
          Plan {planVersion.plan.slug} {totalPricePlan.displayAmount}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 space-y-4">
          {features.map((f) => (
            <LineItem
              key={f.id}
              title={f.feature.title}
              used={f.usage.usage ?? 0}
              max={f.usage.limit ?? 0}
              feature={f}
              displayPrice={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const LineItem: React.FC<{
  displayPrice?: boolean
  title: string
  used: number
  max?: number | null
  feature: RouterOutputs["planVersions"]["getById"]["planVersion"]["planFeatures"][number]
  forecast?: boolean
  included?: number
  units?: number | null
  unitsTitle?: string
}> = (props) => {
  const { val: price, err } = calculatePricePerFeature({
    feature: props.feature,
    quantity: props.used,
  })

  if (err) {
    return <div className="text-red-500">{err.message}</div>
  }

  const forecast = forecastUsage(props.used)
  const included = props.included ?? 0

  return (
    <div className="flex items-center justify-between">
      <div
        className={cn("flex flex-col gap-2", {
          "w-2/3": props.displayPrice,
          "w-full": !props.displayPrice,
        })}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-content capitalize">{props.title}</span>
          {included ? (
            <span className="text-right text-content-subtle text-xs">
              {Intl.NumberFormat("en-US", { notation: "compact" }).format(included)} included
            </span>
          ) : null}
        </div>
        <ProgressBar value={props.used} max={props.max ?? 0} />
        <div className="flex items-center justify-between">
          <span className="text-content-subtle text-xs">
            Used {Intl.NumberFormat("en-US", { notation: "compact" }).format(props.used)}
          </span>
          {props.forecast ? (
            <span className="text-content-subtle text-xs">
              {Intl.NumberFormat("en-US", { notation: "compact" }).format(forecast)} forecasted
            </span>
          ) : null}
        </div>
      </div>
      {props.displayPrice ? (
        <span className={cn("text-sm tabular-nums")}>{price.totalPrice.displayAmount}</span>
      ) : null}
    </div>
  )
}

function forecastUsage(currentUsage: number): number {
  const t = new Date()
  t.setUTCDate(1)
  t.setUTCHours(0, 0, 0, 0)

  const start = t.getTime()
  t.setUTCMonth(t.getUTCMonth() + 1)
  const end = t.getTime() - 1

  const passed = (Date.now() - start) / (end - start)

  return currentUsage * (1 + 1 / passed)
}
