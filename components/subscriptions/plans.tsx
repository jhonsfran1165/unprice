"use client"

import { pricingSubscriptions } from "@/lib/config/subscriptions"
import { useStore } from "@/lib/stores/layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SubscriptionPlansDescription from "@/components/subscriptions/plan-description"

export default function SubscriptionPlans() {
  const { projectData } = useStore()

  const currentPlan = pricingSubscriptions.find(
    (plan) => plan.plan === projectData?.tier
  )

  return (
    <div className="space-y-10 md:px-0">
      <div>
        <h3>Subscription plans</h3>
        <p className="font-medium pt-4 text-sm">
          The project will be permanently deleted, including its deployments and
          domains. This action is irreversible and can not be undone.
        </p>
      </div>
      {/* TODO: add loading state cuz current plan comes from useProject hook. */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:space-y-0 space-y-4">
          <div className="flex justify-start w-1/2">
            You are currently on the plan{" "}
            <Badge className="mx-2 primary h-6">
              {currentPlan?.plan || "FREE"}
            </Badge>
          </div>
          <div className="flex flex-col justify-end w-1/2 items-center px-6 pb-6">
            <SubscriptionPlansDescription
              plan={currentPlan}
              cta="View features"
              isCurrentPlan={true}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Available plans</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:space-y-0 space-y-4">
          <div className="flex justify-start w-1/2">
            These are the new plans you can pick to upgrade subscriptions
          </div>
          <div className="flex flex-col justify-end w-1/2 items-center px-6 pb-6">
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
