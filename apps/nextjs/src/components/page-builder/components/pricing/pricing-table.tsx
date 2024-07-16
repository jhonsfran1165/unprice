"use client"

import { cn } from "@builderai/ui/utils"
import { type UserComponent, useNode } from "@craftjs/core"
import {
  PricingCard,
  PricingCardSkeleton,
} from "~/app/(root)/(authenticated)/app/[workspaceSlug]/[projectSlug]/plans/[planSlug]/[planVersionId]/review/_components/pricing-card"
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
      className={cn("mx-auto flex w-full gap-5")}
    >
      {plans.length > 0 &&
        plans.map((plan) => <PricingCard key={Math.random()} planVersion={plan} />)}
      {plans.length === 0 && [1, 2, 3].map((index) => <PricingCardSkeleton key={index} />)}
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
