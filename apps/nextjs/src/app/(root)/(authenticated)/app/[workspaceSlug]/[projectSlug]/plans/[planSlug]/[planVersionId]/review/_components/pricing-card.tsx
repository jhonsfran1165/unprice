import type { RouterOutputs } from "@builderai/api"
import type { BillingPeriod } from "@builderai/db/validators"
import { calculateFlatPricePlan, calculatePricePerFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@builderai/ui/card"
import { CheckIcon, HelpCircle } from "@builderai/ui/icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"

export function PricingCard({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  const { err, val: totalPricePlan } = calculateFlatPricePlan({
    planVersion,
  })

  return (
    <Card className="mx-auto max-w-[300px]">
      <CardHeader>
        <h3 className="font-bold text-2xl">{planVersion.title}</h3>
      </CardHeader>

      <CardContent>
        <CardDescription>{planVersion.description}</CardDescription>
        <div className="mt-8 flex items-baseline space-x-2">
          <span className="font-extrabold text-5xl">
            {err ? "Error" : totalPricePlan.displayAmount}
          </span>
          <span className="">/ {planVersion.billingPeriod} + usage</span>
        </div>
        <Button className="mt-8 w-full">Get Started</Button>
      </CardContent>
      <CardFooter className="border-t px-6 py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">Features Included</h4>
            <ul className="space-y-6 px-2">
              {planVersion.planFeatures.map((feature) => {
                return (
                  <li key={feature.id} className="flex items-center">
                    <ItemPriceCard feature={feature} billingPeriod={planVersion.billingPeriod} />
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

function ItemPriceCard({
  billingPeriod,
  feature,
}: {
  feature: RouterOutputs["planVersions"]["getById"]["planVersion"]["planFeatures"][number]
  billingPeriod: BillingPeriod | null
}) {
  const { err, val: pricePerFeature } = calculatePricePerFeature({
    feature: feature,
    quantity: feature.defaultQuantity ?? 1,
  })

  if (err) {
    return <div className="inline text-muted-foreground text-xs italic">error calculation</div>
  }

  return (
    <div className="flex flex-row items-center justify-between gap-1">
      <div className="flex justify-start">
        <CheckIcon className="mr-2 h-5 w-5 text-success" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-sm">
              {feature.limit
                ? `Up to ${feature.limit} ${feature.feature.slug}`
                : feature.defaultQuantity
                  ? `${feature.defaultQuantity} ${feature.feature.slug}`
                  : `${feature.feature.slug}`}{" "}
              - {feature.featureType} rate
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 font-light" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-[200px] text-sm">{feature.feature.description}</div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-xs">
            {pricePerFeature.unitPrice.displayAmount}/{billingPeriod}
          </div>
        </div>
      </div>
    </div>
  )
}
