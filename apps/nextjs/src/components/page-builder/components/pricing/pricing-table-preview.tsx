import type { UserComponent } from "@craftjs/core"
import { PricingCard } from "~/components/forms/pricing-card"
import type { PricingComponentProps } from "./types"

export const PricingTablePreview: UserComponent<PricingComponentProps> = (props) => {
  const { plans } = props

  if (!plans.length) return null

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 md:flex-row md:items-stretch">
      {plans
        .filter((plan) => plan?.id)
        .map((plan) => (
          <PricingCard key={Math.random()} planVersion={plan} />
        ))}
    </div>
  )
}
