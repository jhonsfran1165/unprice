import type { UserComponent } from "@craftjs/core"
import { PricingCard } from "~/app/(root)/(authenticated)/app/[workspaceSlug]/[projectSlug]/plans/[planSlug]/[planVersionId]/review/_components/pricing-card"
import type { PricingComponentProps } from "./types"

export const PricingTablePreview: UserComponent<PricingComponentProps> = (props) => {
  const { plans } = props

  return (
    <div className="mx-auto flex flex-shrink gap-5">
      {plans.length > 0 && plans.map((plan) => <PricingCard key={plan.id} planVersion={plan} />)}
    </div>
  )
}
