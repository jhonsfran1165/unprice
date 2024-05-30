import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@builderai/ui/card"
import { CheckIcon } from "@builderai/ui/icons"

import { currencySymbol } from "~/lib/currency"

export function PricingCard({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <h3 className="text-2xl font-bold">{planVersion.title}</h3>
        <p className="mt-2 text-lg">{planVersion.description}</p>
      </CardHeader>
      <CardContent>
        <div className="mt-8 flex items-baseline space-x-2">
          <span className="text-5xl font-extrabold">{`${currencySymbol("USD")}10`}</span>
          <span className="">/month</span>
        </div>
        <Button className="mt-8 w-full">Get Started</Button>
      </CardContent>
      <CardFooter className="rounded-b-lg border-t bg-background-base bg-opacity-10 px-6 py-4 opacity-80">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Features</h4>

            <ul className="space-y-2 text-sm">
              {planVersion.planFeatures.map((feature) => {
                if (feature.type === "addon") return null

                return (
                  <li key={feature.id} className="flex items-center">
                    <CheckIcon className="mr-2 h-5 w-5 text-success" />
                    {feature.feature.slug}
                    <span className="pl-2 text-background-solid">
                      ($5/month)
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Addons</h4>

            <ul className="space-y-2 text-sm">
              {planVersion.planFeatures.map((feature) => {
                if (feature.type === "feature") return null

                return (
                  <li key={feature.id} className="flex items-center">
                    <CheckIcon className="mr-2 h-5 w-5 text-success" />
                    {feature.feature.slug}
                    <span className="pl-2 text-background-solid">
                      ($5/month)
                    </span>
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
