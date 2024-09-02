"use client"

import type { RouterOutputs } from "@unprice/api"
import {
  calculateFlatPricePlan,
  calculateFreeUnits,
  calculatePricePerFeature,
  calculateTotalPricePlan,
} from "@unprice/db/validators"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { cn } from "@unprice/ui/utils"
import { ProgressBar } from "~/components/analytics/progress"

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

  // TODO: handle case where no subscription is found
  if (!subscription || !planVersion) return null

  const { err, val: flatPricePlan } = calculateFlatPricePlan({
    planVersion: planVersion,
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
  })

  const { val: totalPricePlanForecast, err: totalPricePlanErrForecast } = calculateTotalPricePlan({
    planVersion: planVersion,
    quantities: quantitiesForecast,
  })

  if (err || totalPricePlanErr || totalPricePlanErrForecast) {
    return (
      <div className="text-red-500">
        {err?.message || totalPricePlanErr?.message || totalPricePlanErrForecast?.message}
      </div>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Usage for the month</CardTitle>
        <div className="flex items-center justify-between py-6 text-content-subtle">
          <div className={cn("flex w-4/5 flex-col gap-2")}>Plan {planVersion.plan.slug}</div>
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
          <span className="font-semibold text-content text-sm">Current Total</span>
          <span className="font-semibold text-content text-md tabular-nums">
            {totalPricePlan.displayAmount}
          </span>
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="text-content-subtle text-xs">Estimated by end of month</span>
          <span className="text-content-subtle text-xs tabular-nums">
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

  const max = ["tier", "package"].includes(feature.featureType)
    ? usage.units ?? 0
    : usage.limit ?? Number.POSITIVE_INFINITY
  const used = ["tier", "package"].includes(feature.featureType)
    ? usage.units ?? 0
    : usage.usage ?? 0

  const { val: price, err } = calculatePricePerFeature({
    feature: feature,
    quantity: used,
  })

  if (err) {
    return <div className="text-red-500">{err.message}</div>
  }

  const freeUnits = calculateFreeUnits({ feature: feature })
  const forecast = forecastUsage(used)
  const included = freeUnits === Number.POSITIVE_INFINITY ? feature.limit : freeUnits

  return (
    <div className="flex items-center justify-between">
      <div className={cn("flex w-4/5 flex-col gap-2")}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-content capitalize">{feature.feature.title}</span>
          <span className="text-right text-content-subtle text-muted-foreground text-xs">
            {Intl.NumberFormat("en-US", { notation: "compact" }).format(included ?? 0)} included
          </span>
        </div>
        <ProgressBar value={used} max={max} />
        <div className="flex items-center justify-between">
          <span className="text-content-subtle text-muted-foreground text-xs">
            Used {Intl.NumberFormat("en-US", { notation: "compact" }).format(used)}
          </span>
          <span className="text-content-subtle text-muted-foreground text-xs">
            {Intl.NumberFormat("en-US", { notation: "compact" }).format(forecast)} forecasted
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
