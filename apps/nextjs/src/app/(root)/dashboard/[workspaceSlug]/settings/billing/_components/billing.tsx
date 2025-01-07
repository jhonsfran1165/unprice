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
  subscription,
  entitlements,
  activePhase,
}: {
  subscription: RouterOutputs["auth"]["mySubscriptions"]["subscriptions"][number]
  entitlements: RouterOutputs["analytics"]["getUsageActiveEntitlementsCustomer"]["entitlements"]
  activePhase: RouterOutputs["auth"]["mySubscriptions"]["subscriptions"][number]["phases"][number]
}) {
  const planVersion = activePhase.planVersion

  const calculatedBillingCycle = calculateBillingCycle({
    currentDate: new Date(),
    startDate: new Date(activePhase.startAt),
    billingCycleStart: activePhase.startCycle ?? 1,
    billingPeriod: planVersion.billingPeriod,
  })

  const { err, val: flatPricePlan } = calculateFlatPricePlan({
    planVersion: planVersion,
    prorate: calculatedBillingCycle.prorationFactor,
  })

  const quantities = entitlements.reduce(
    (acc, entitlement) => {
      acc[entitlement.id] =
        entitlement.featureType === "usage" ? entitlement.usage ?? 0 : entitlement.units ?? 0
      return acc
    },
    {} as Record<string, number>
  )

  const quantitiesForecast = entitlements.reduce(
    (acc, entitlement) => {
      acc[entitlement.id] =
        entitlement.featureType === "usage"
          ? forecastUsage(entitlement.usage ?? 0)
          : entitlement.units ?? 0
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

  const isTrial = activePhase.trialEndsAt ? activePhase.trialEndsAt > Date.now() : false

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
        <CardTitle>Subscription Entitlements</CardTitle>
        {isTrial && (
          <CardDescription>
            {activePhase.trialEndsAt &&
              subscription.currentCycleEndAt &&
              `You currently are on the trial of the ${
                planVersion.plan.slug
              } plan. After the trial ends on ${formatDate(
                activePhase.trialEndsAt,
                subscription.timezone,
                "MMM d, yy"
              )}, you will be billed in the next billing cycle on ${formatDate(
                subscription.currentCycleEndAt,
                subscription.timezone,
                "MMM d, yy"
              )} the following price.`}
          </CardDescription>
        )}
        <div className="flex items-center justify-between py-6 text-content-subtle">
          <div className={cn("inline-flex w-4/5 items-center gap-2")}>
            Plan {isTrial ? "trial" : ""}{" "}
            <span className="text-primary">{planVersion.plan.slug}</span>
            <Typography variant="p" affects="removePaddingMargin">
              {activePhase.planVersion.billingPeriod}{" "}
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
          {entitlements.map((entitlement) => {
            const planVersionFeature = planVersion.planFeatures.find(
              (e) => e.id === entitlement.featurePlanVersionId
            )

            if (!planVersionFeature) return null

            return (
              <LineUsageItem
                key={entitlement.id}
                entitlement={entitlement}
                planVersionFeature={planVersionFeature}
              />
            )
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

const LineUsageItem: React.FC<{
  entitlement: RouterOutputs["analytics"]["getUsageActiveEntitlementsCustomer"]["entitlements"][number]
  planVersionFeature: RouterOutputs["planVersions"]["getById"]["planVersion"]["planFeatures"][number]
}> = (props) => {
  const { entitlement, planVersionFeature } = props

  const isFlat = entitlement.featureType === "flat"

  // separate logic for tiers and packages and usage features
  const max = ["tier", "package"].includes(entitlement.featureType)
    ? entitlement.units ?? 0
    : entitlement.limit ?? Number.POSITIVE_INFINITY

  const used = entitlement.usage ?? 0

  const { val: price, err } = calculatePricePerFeature({
    feature: planVersionFeature,
    // tier and package features are calculated based on units which are the units the customer has purchased
    // usage features are calculated based on usage which is the usage of the feature
    quantity: ["tier", "package"].includes(entitlement.featureType)
      ? entitlement.units ?? 0
      : entitlement.usage ?? 0,
  })

  if (err) {
    return <div className="text-danger">{err.message}</div>
  }

  if (isFlat) {
    return (
      <div className="flex items-center justify-between">
        <div className={cn("flex w-4/5 flex-col gap-2")}>
          <div className="flex items-center justify-between">
            <PricingItem
              feature={planVersionFeature}
              className="font-semibold text-content text-md"
              noCheckIcon
            />
            <span className="text-right text-content-subtle text-muted-foreground text-xs">
              Flat feature
            </span>
          </div>
          <ProgressBar value={used} max={max} />
          <div className="flex items-center justify-between">
            <span className="text-content-subtle text-muted-foreground text-xs">N/A usage</span>
          </div>
        </div>
        <span className={cn("text-sm tabular-nums")}>{price.totalPrice.displayAmount}</span>
      </div>
    )
  }

  const freeUnits = calculateFreeUnits({ feature: planVersionFeature })
  const forecast = forecastUsage(used)
  const included =
    freeUnits === Number.POSITIVE_INFINITY
      ? planVersionFeature.limit ?? Number.POSITIVE_INFINITY
      : freeUnits

  return (
    <div className="flex items-center justify-between">
      <div className={cn("flex w-4/5 flex-col gap-2")}>
        <div className="flex items-center justify-between">
          <PricingItem
            feature={planVersionFeature}
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
