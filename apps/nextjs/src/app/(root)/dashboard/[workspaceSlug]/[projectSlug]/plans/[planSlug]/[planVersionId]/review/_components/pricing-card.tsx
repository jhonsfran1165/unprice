import type { RouterOutputs } from "@unprice/api"
import { calculateFlatPricePlan } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@unprice/ui/card"
import { Skeleton } from "@unprice/ui/skeleton"
import { Typography } from "@unprice/ui/typography"
import { ItemPriceCard } from "./pricing-item"

export function PricingCard({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  const { err, val: totalPricePlan } = calculateFlatPricePlan({
    planVersion,
  })

  return (
    <Card className="flex w-[300px] flex-col">
      <CardHeader className="space-y-6">
        <Typography variant="h2">{planVersion.plan.slug}</Typography>

        {/* // only show the price if it's not an enterprise plan */}
        {!planVersion.plan.enterprisePlan && (
          <div className="mt-8 flex items-baseline space-x-2">
            <span className="font-extrabold text-4xl">
              {err
                ? "Error"
                : totalPricePlan?.hasUsage
                  ? `+${totalPricePlan.displayAmount}`
                  : totalPricePlan.displayAmount}
            </span>
            <span className="text-sm">{planVersion.billingPeriod}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <CardDescription>{planVersion.description}</CardDescription>
        <Typography variant="p" affects="removePaddingMargin" className="text-end italic">
          {totalPricePlan?.hasUsage ? "+ usage in the period" : ""}
        </Typography>
        <Button className="w-full">
          {planVersion.plan.enterprisePlan ? "Contact Us" : "Get Started"}
        </Button>
      </CardContent>

      <CardFooter className="flex w-full flex-col border-t px-6 py-6">
        <div className="w-full space-y-6">
          <div className="w-full space-y-2">
            <Typography variant="h4">Features Included</Typography>
            <ul className="flex w-full flex-col space-y-4 py-4">
              {planVersion.planFeatures
                .filter((f) => !f.hidden)
                .map((feature) => {
                  return (
                    <li key={feature.id} className="flex w-full flex-col justify-start">
                      <ItemPriceCard feature={feature} withCalculator />
                    </li>
                  )
                })}
            </ul>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export function PricingCardSkeleton() {
  return (
    <Card className="mx-auto max-w-[300px]">
      <CardHeader>
        <Typography variant="h3">
          <Skeleton className="h-[36px]" />
        </Typography>
      </CardHeader>

      <CardContent>
        <CardDescription className="animate-pulse rounded-md bg-accent">&nbsp;</CardDescription>
        <div className="mt-8 flex items-baseline space-x-2">
          <span className="font-extrabold text-5xl">$0</span>
          <span className="">month</span>
        </div>
        <Button className="mt-8 w-full">Get Started</Button>
      </CardContent>
      <CardFooter className="border-t px-6 py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Typography variant="h4">Features Included</Typography>
            <ul className="space-y-6 px-2">
              {[1, 2, 3, 4, 5].map((e) => {
                return (
                  <li key={e} className="flex flex-col items-center">
                    <Skeleton className="h-[20px] w-full" />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
