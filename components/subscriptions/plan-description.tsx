import { Package } from "lucide-react"

import { SubscriptionPlan } from "@/lib/types"
import { PricingDialog } from "@/components/subscriptions/pricing-dialog"

export default function SubscriptionPlansDescription({
  plan,
  cta,
  isCurrentPlan,
  billingStart,
  billingEnd,
}: {
  plan?: SubscriptionPlan
  cta: string
  isCurrentPlan: boolean
  billingStart?: string
  billingEnd?: string
}) {
  if (!plan) return null

  const planName = plan.plan
  const limits = plan.limits
  const copy = plan.copy

  return (
    <>
      <div className="flex w-full justify-start">
        <Package className="mr-2 h-6 w-6" />
        <h4 className="font-semibold">{planName}</h4>
      </div>
      <div className="ml-16 w-full justify-start py-3 text-sm">
        {Object.keys(limits ?? {}).map((key) => {
          // TODO: add usage here
          return isCurrentPlan ? (
            <div key={key}>
              2/{limits && limits[key]} {key}
            </div>
          ) : (
            <div key={key}>
              {limits && limits[key]} {key}
            </div>
          )
        })}
        {/* TODO: add billing */}
        {isCurrentPlan && (
          <div className="mt-4">
            billing cycle:{" "}
            <b>
              {billingStart} - {billingEnd}
            </b>
          </div>
        )}
      </div>
      <div className="pb-8 pt-4">
        {copy} <PricingDialog cta={cta} />
      </div>
    </>
  )
}
