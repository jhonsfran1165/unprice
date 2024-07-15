"use client"

import { type UserComponent, useNode } from "@craftjs/core"
import { PricingCard } from "~/app/(root)/(authenticated)/app/[workspaceSlug]/[projectSlug]/plans/[planSlug]/[planVersionId]/review/_components/pricing-card"
import { PricingTableSettings } from "./settings"
import type { PricingComponentProps } from "./types"

export const PricingTableComponent: UserComponent<PricingComponentProps> = (props) => {
  const {
    connectors: { connect },
  } = useNode()

  const { plans } = props

  return (
    <div
      ref={(ref) => {
        ref && connect(ref)
      }}
      className="mx-auto flex flex-shrink gap-5"
    >
      {plans.length > 0 && plans.map((plan) => (
        <PricingCard key={plan.id} planVersion={plan} />
      ))}
    </div>
  )
}

PricingTableComponent.craft = {
  displayName: "Pricing",
  props: {
    plans: [],
  },
  related: {
    toolbar: PricingTableSettings,
  },
}
