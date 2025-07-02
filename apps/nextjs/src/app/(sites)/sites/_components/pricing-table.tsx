"use client"

import { cn } from "@unprice/ui/utils"
import type * as React from "react"
import { PricingCard, type PricingPlan } from "./pricing-card"

export interface PricingTableProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  plans: PricingPlan[]
  yearlyDiscount?: number
  discountLabel?: string
  popularPlan: string
}

export function PricingTable({
  title = "Simple, Transparent Pricing",
  subtitle = "Choose the plan that's right for you",
  plans,
  discountLabel = "Save",
  className,
  popularPlan,
  ...props
}: PricingTableProps) {
  return (
    <div className={cn("w-full py-10", className)} {...props}>
      <div className="mb-20 text-center">
        <h2 className="font-bold text-3xl tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} isPopular={plan.name === popularPlan} />
        ))}
      </div>
    </div>
  )
}
