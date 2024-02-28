import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"
import { SubscriptionForm } from "./subscription-form"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default function BillingPage() {
  return (
    <>
      <SubscriptionCard />
      <UsageCard />
    </>
  )
}

async function SubscriptionCard() {
  const { subscription } = await api.auth.mySubscription()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div>
            You are currently on the <strong>{subscription.plan}</strong> plan.
            {subscription.billingPeriodEnd && (
              <strong>
                Your subscription will renew on{" "}
                {formatDate(subscription.billingPeriodEnd)}.{" "}
              </strong>
            )}
          </div>
        ) : (
          <div>You are not subscribed to any plan.</div>
        )}
      </CardContent>
      <CardFooter>
        <SubscriptionForm hasSubscription={!!subscription} />
      </CardFooter>
    </Card>
  )
}

function UsageCard() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent>TODO</CardContent>
    </Card>
  )
}
