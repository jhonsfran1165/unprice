"use client"

import type { RouterOutputs } from "@unprice/api"
import {
  calculateBillingCycle,
  calculateFlatPricePlan,
  calculateFreeUnits,
  calculatePricePerFeature,
  calculateTotalPricePlan,
} from "@unprice/db/validators"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@unprice/ui/card"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { ProgressBar } from "~/components/analytics/progress"
import { PricingItem } from "~/components/forms/pricing-item"
import { formatDate } from "~/lib/dates"
import { nFormatter } from "~/lib/nformatter"

export function BillingCard({
  subscriptions,
  featuresWithUsage,
}: {
  subscriptions: RouterOutputs["auth"]["mySubscriptions"]["subscriptions"]
  featuresWithUsage: RouterOutputs["analytics"]["getUsageCustomerUnprice"]["featuresWithUsage"]
}) {
  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]
  const planVersion = subscription?.planVersion

  // all users should have a subscription
  if (!subscription || !planVersion) return null

  const calculatedBillingCycle = calculateBillingCycle({
    currentDate: new Date(),
    startDate: new Date(subscription.startAt),
    billingCycleStart: subscription.startCycle ?? 1,
    billingPeriod: planVersion.billingPeriod ?? "month",
  })

  const { err, val: flatPricePlan } = calculateFlatPricePlan({
    planVersion: planVersion,
    prorate: calculatedBillingCycle.prorationFactor,
  })

  const quantities = featuresWithUsage.reduce(
    (acc, feature) => {
      acc[feature.id] =
        feature.featureType === "usage" ? feature.usage.usage ?? 0 : feature.usage.units ?? 0
      return acc
    },
    {} as Record<string, number>
  )

  const quantitiesForecast = featuresWithUsage.reduce(
    (acc, feature) => {
      acc[feature.id] =
        feature.featureType === "usage"
          ? forecastUsage(feature.usage.usage ?? 0)
          : feature.usage.units ?? 0
      return acc
    },
    {} as Record<string, number>
  )

  const { val: totalPricePlan, err: totalPricePlanErr } = calculateTotalPricePlan({
    planVersion: planVersion,
    quantities: quantities,
    prorate: calculatedBillingCycle.prorationFactor,
  })

  const { val: totalPricePlanForecast, err: totalPricePlanErrForecast } = calculateTotalPricePlan({
    planVersion: planVersion,
    quantities: quantitiesForecast,
    prorate: calculatedBillingCycle.prorationFactor,
  })

  const isTrial = subscription.trialEndsAt ? subscription.trialEndsAt > Date.now() : false

  if (err || totalPricePlanErr || totalPricePlanErrForecast) {
    return (
      <div className="text-danger">
        {err?.message || totalPricePlanErr?.message || totalPricePlanErrForecast?.message}
      </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Subscription usage</CardTitle>
        <CardDescription>
          {isTrial &&
            subscription.trialEndsAt &&
            subscription.billingCycleEndAt &&
            `You currently are on the trial of the ${
              planVersion.plan.slug
            } plan. After the trial ends on ${formatDate(
              subscription.trialEndsAt,
              subscription.timezone,
              "MMM d, yy"
            )}, you will be billed in the next billing cycle on ${formatDate(
              subscription.billingCycleEndAt,
              subscription.timezone,
              "MMM d, yy"
            )} the following price.`}
        </CardDescription>
        <div className="flex items-center justify-between py-6 text-content-subtle">
          <div className={cn("inline-flex w-4/5 items-center gap-2")}>
            Plan {isTrial ? "trial" : ""}{" "}
            <span className="text-primary">{planVersion.plan.slug}</span>
            <Typography variant="p" affects="removePaddingMargin">
              {calculatedBillingCycle.prorationFactor < 1 ? "(prorated)" : ""}
            </Typography>
          </div>
          <div className={cn("w-1/5 text-end font-semibold text-md tabular-nums")}>
            {flatPricePlan.displayAmount}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 space-y-4">
          {featuresWithUsage
            .filter((f) => f.featureType !== "flat")
            .map((f) => {
              return <LineItem key={f.id} featureWithUsage={f} />
            })}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t py-4">
        <div className="flex w-full items-center justify-between">
          <span className="inline-flex items-center gap-1 font-semibold text-content text-sm">
            Current Total
            <Typography variant="p" affects="removePaddingMargin" className="text-xs">
              {calculatedBillingCycle.prorationFactor < 1 ? "(prorated)" : ""}
            </Typography>
          </span>
          <span className="font-semibold text-content text-md tabular-nums">
            {totalPricePlan.displayAmount}
          </span>
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="inline-flex items-center gap-1 text-content-subtle text-muted-foreground text-xs">
            Estimated by end of month{" "}
            <Typography variant="p" affects="removePaddingMargin" className="text-xs">
              {calculatedBillingCycle.prorationFactor < 1 ? "(prorated)" : ""}
            </Typography>
          </span>
          <span className="text-content-subtle text-muted-foreground text-xs tabular-nums">
            {totalPricePlanForecast.displayAmount}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

const LineItem: React.FC<{
  featureWithUsage: RouterOutputs["analytics"]["getUsageCustomerUnprice"]["featuresWithUsage"][number]
}> = (props) => {
  const { usage, ...feature } = props.featureWithUsage

  // separate logic for tiers and packages and usage features
  const max = ["tier", "package"].includes(feature.featureType)
    ? usage.units ?? 0
    : usage.limit ?? Number.POSITIVE_INFINITY
  const used = usage.usage ?? 0

  const { val: price, err } = calculatePricePerFeature({
    feature: feature,
    // tier and package features are calculated based on units which are the units the customer has purchased
    // usage features are calculated based on usage which is the usage of the feature
    quantity: ["tier", "package"].includes(feature.featureType)
      ? usage.units ?? 0
      : usage.usage ?? 0,
  })

  if (err) {
    return <div className="text-danger">{err.message}</div>
  }

  const freeUnits = calculateFreeUnits({ feature: feature })
  const forecast = forecastUsage(used)
  const included =
    freeUnits === Number.POSITIVE_INFINITY ? feature.limit ?? Number.POSITIVE_INFINITY : freeUnits

  return (
    <div className="flex items-center justify-between">
      <div className={cn("flex w-4/5 flex-col gap-2")}>
        <div className="flex items-center justify-between">
          <PricingItem
            feature={feature}
            className="font-semibold text-content text-md capitalize"
            noCheckIcon
          />
          <span className="text-right text-content-subtle text-muted-foreground text-xs">
            {nFormatter(included)} included
          </span>
        </div>
        <ProgressBar value={used} max={max} />
        <div className="flex items-center justify-between">
          <span className="text-content-subtle text-muted-foreground text-xs">
            Used {nFormatter(used)}
          </span>
          <span className="text-content-subtle text-muted-foreground text-xs">
            {nFormatter(forecast)} forecasted
          </span>
        </div>
      </div>
      <span className={cn("text-sm tabular-nums")}>{price.totalPrice.displayAmount}</span>
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

  return Math.round(currentUsage * (1 + 1 / passed))
}
