"use client"

import { useMemo } from "react"

import { pricingSubscriptions } from "@/lib/config/subscriptions"
import { useStore } from "@/lib/stores/layout"
import { getDateTimeLocal, getFirstAndLastDay } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SubscriptionPlansDescription from "@/components/subscriptions/plan-description"

export default function SubscriptionPlans() {
  const { projectData } = useStore()

  const currentPlan = pricingSubscriptions.find(
    (plan) => plan.plan === projectData?.tier
  )

  const [billingStart, billingEnd] = useMemo(() => {
    const startDate = new Date(
      projectData?.subscription_period_starts ?? getDateTimeLocal()
    )

    if (startDate) {
      const { firstDay, lastDay } = getFirstAndLastDay(startDate.getDay())
      const start = firstDay.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
      const end = lastDay.toLocaleDateString("en-us", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      })
      return [start, end]
    }
    return []
  }, [projectData?.subscription_period_starts])

  return (
    <div className="space-y-10 md:px-0">
      <div>
        <h3>Subscription plans</h3>
        <p className="pt-4 text-sm font-medium">
          The project will be permanently deleted, including its deployments and
          domains. This action is irreversible and can not be undone.
        </p>
      </div>
      {/* TODO: add loading state cuz current plan comes from useProject hook. */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 md:flex-row md:space-y-0">
          <div className="flex w-1/2 justify-start">
            You are currently on the plan{" "}
            <Badge className="primary mx-2 h-6">
              {currentPlan?.plan || "FREE"}
            </Badge>
          </div>
          <div className="flex w-1/2 flex-col items-center justify-end px-6 pb-6">
            <SubscriptionPlansDescription
              plan={currentPlan}
              cta="View features"
              isCurrentPlan={true}
              billingStart={billingStart}
              billingEnd={billingEnd}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Available plans</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 md:flex-row md:space-y-0">
          <div className="flex w-1/2 justify-start">
            These are the new plans you can pick to upgrade subscriptions
          </div>
          <div className="flex w-1/2 flex-col items-center justify-end px-6 pb-6">
            {pricingSubscriptions
              .filter((plan) => plan.plan !== projectData?.tier)
              .map((plan) => {
                return (
                  <SubscriptionPlansDescription
                    key={plan.plan}
                    plan={plan}
                    cta="Upgrade"
                    isCurrentPlan={false}
                  />
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
