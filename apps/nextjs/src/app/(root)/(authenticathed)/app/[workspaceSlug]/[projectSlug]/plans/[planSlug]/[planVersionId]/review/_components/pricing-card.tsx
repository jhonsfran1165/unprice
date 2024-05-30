import type { RouterOutputs } from "@builderai/api"
import { calculatePricePerFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@builderai/ui/card"
import { CheckIcon, HelpCircle } from "@builderai/ui/icons"
import { Tooltip, TooltipContent, TooltipTrigger } from "@builderai/ui/tooltip"

import { currencySymbol } from "~/lib/currency"

export function PricingCard({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  const addons = planVersion.planFeatures.filter(
    (feature) => feature.type === "addon"
  )

  const features = planVersion.planFeatures.filter(
    (feature) => feature.type === "feature"
  )

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <h3 className="text-2xl font-bold">{planVersion.title}</h3>
      </CardHeader>

      <CardContent>
        <CardDescription>{planVersion.description}</CardDescription>
        <div className="mt-8 flex items-baseline space-x-2">
          <span className="text-5xl font-extrabold">{`${currencySymbol("USD")}10`}</span>
          <span className="">/month</span>
        </div>
        <Button className="mt-8 w-full">Get Started</Button>
      </CardContent>
      <CardFooter className="border-t px-6 py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Features Included</h4>

            <ul className="space-y-4 px-2">
              {features.map((feature) => {
                const { err, val: pricePerFeature } = calculatePricePerFeature({
                  feature: feature,
                  quantity: feature.defaultQuantity ?? 0,
                  planVersion: planVersion,
                })

                if (err) {
                  return null
                }

                return (
                  <li key={feature.id} className="flex items-center">
                    <div className="flex flex-row items-center justify-between gap-1">
                      <div className="flex justify-start">
                        <CheckIcon className="text-success mr-2 h-5 w-5" />
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
                                <div className="max-w-[200px] text-sm">
                                  {feature.feature.description}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="text-xs">
                            {pricePerFeature.unitPriceText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Addons</h4>

            <ul className="space-y-4 px-2">
              {addons.map((feature) => {
                const { err, val: pricePerFeature } = calculatePricePerFeature({
                  feature: feature,
                  quantity: feature.defaultQuantity ?? 0,
                  planVersion: planVersion,
                })

                if (err) {
                  return null
                }

                return (
                  <li key={feature.id} className="flex items-center">
                    <div className="flex flex-row items-center justify-between gap-1">
                      <div className="flex justify-start">
                        <CheckIcon className="text-success mr-2 h-5 w-5" />
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
                                <div className="max-w-[200px] text-sm">
                                  {feature.feature.description}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="text-xs">
                            {pricePerFeature.unitPriceText}
                          </div>
                        </div>
                      </div>
                    </div>
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
