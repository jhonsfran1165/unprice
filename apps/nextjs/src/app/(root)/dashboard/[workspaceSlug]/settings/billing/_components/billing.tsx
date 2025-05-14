"use client"

import { nFormatter } from "@unprice/db/utils"
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
import type { unprice } from "~/lib/unprice"

type Usage = NonNullable<Awaited<ReturnType<typeof unprice.customers.getUsage>>["result"]>

export function BillingCard({
  usage,
}: {
  usage: Usage
}) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Subscription Entitlements</CardTitle>
        {usage.phase.isTrial && (
          <CardDescription>
            {usage.phase.trialEndsAt &&
              usage.phase.endAt &&
              `You currently are on the trial of the ${<span className="font-bold">{usage.subscription.planSlug}</span>} plan. After the trial ends on ${formatDate(
                usage.phase.trialEndsAt,
                usage.subscription.timezone,
                "MMM d, yy"
              )}, you will be billed in the next billing cycle on ${formatDate(
                usage.subscription.currentCycleEndAt,
                usage.subscription.timezone,
                "MMM d, yy"
              )} the following price.`}
          </CardDescription>
        )}
        <div className="flex items-center justify-between py-6 text-content-subtle">
          <div className={cn("w-4/5 items-center gap-2")}>
            <span className="font-bold">
              Plan {usage.phase.isTrial ? "trial" : ""} {usage.subscription.planSlug}
            </span>
            <Typography variant="p" affects="removePaddingMargin">
              {usage.planVersion.description}
            </Typography>
          </div>
          <div className={cn("w-1/5 text-end font-semibold text-md tabular-nums")}>
            {usage.planVersion.flatPrice}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4 space-y-4">
          {usage.entitlement.map((entitlement) => (
            <LineUsageItem key={entitlement.featureSlug} entitlement={entitlement} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t py-4">
        <div className="flex w-full items-center justify-between">
          <span className="inline-flex items-center gap-1 font-semibold text-content text-sm">
            Current Total
            <Typography variant="p" affects="removePaddingMargin" className="text-xs">
              {usage.subscription.prorationFactor < 1 ? "(prorated)" : ""}
            </Typography>
          </span>
          <span className="font-semibold text-content text-md tabular-nums">
            {usage.planVersion.currentTotalPrice}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

const LineUsageItem: React.FC<{
  entitlement: Usage["entitlement"][number]
}> = (props) => {
  const { entitlement } = props
  const isFlat = entitlement.featureType === "flat"
  const used = entitlement.usage ?? 0

  if (isFlat) {
    return (
      <div className="flex items-center justify-between">
        <div className={cn("flex w-4/5 flex-col gap-2")}>
          <div className="flex items-center justify-between">
            <PricingItem
              feature={entitlement.featureVersion}
              className="font-semibold text-content text-md"
              noCheckIcon
            />
            <span className="text-right text-content-subtle text-muted-foreground text-xs">
              Flat feature
            </span>
          </div>
          <ProgressBar value={used} max={entitlement.max ?? Number.POSITIVE_INFINITY} />
          <div className="flex items-center justify-between">
            <span className="text-content-subtle text-muted-foreground text-xs">N/A usage</span>
          </div>
        </div>
        <span className={cn("text-sm tabular-nums")}>{entitlement.price}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className={cn("flex w-4/5 flex-col gap-2")}>
        <div className="flex items-center justify-between">
          <PricingItem
            feature={entitlement.featureVersion}
            className="font-semibold text-content text-md"
            noCheckIcon
          />
          <span className="text-right text-content-subtle text-muted-foreground text-xs">
            {nFormatter(entitlement.included ?? 0)} included
          </span>
        </div>
        <ProgressBar value={used} max={entitlement.max ?? Number.POSITIVE_INFINITY} />
        <div className="flex items-center justify-between">
          <span className="text-content-subtle text-muted-foreground text-xs">
            Used {nFormatter(used)}
          </span>
        </div>
      </div>
      <span className={cn("text-sm tabular-nums")}>{entitlement.price}</span>
    </div>
  )
}
