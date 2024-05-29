import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { CheckCircle2 } from "@builderai/ui/icons"

import { currencySymbol } from "~/lib/currency"

export function PricingCard({
  planVersion,
}: {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}) {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle className="text-center">{planVersion.title}</CardTitle>
        <div className="text-center text-2xl font-bold">
          {`${currencySymbol("USD")}10`}

          <span className="text-base font-normal"> / month</span>
        </div>
        <CardDescription>{planVersion.description}</CardDescription>
      </CardHeader>

      <ul className="flex flex-col justify-center gap-3 px-6 pb-6">
        {planVersion.planFeatures.map((feature) => (
          <li key={feature.id} className="flex items-center">
            <CheckCircle2 className="mr-2 h-6 w-6 fill-primary text-primary-foreground" />
            {feature.feature.slug}
          </li>
        ))}
      </ul>

      <CardFooter>
        <Button>Subscribe now</Button>
      </CardFooter>
    </Card>
  )
}
