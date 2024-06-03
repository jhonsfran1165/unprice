import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

import { formatDate } from "~/lib/dates"
import { api } from "~/trpc/server"

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
  const { subscriptions } = await api.auth.mySubscriptions()

  // TODO: customer can have multiple subscriptions
  const subscription = subscriptions[0]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div>
            You are currently on the{" "}
            <strong>{subscription.planVersion.title}</strong> plan.
            {subscription.startDate && (
              <strong>
                Your subscription will renew on{" "}
                {formatDate(subscription.startDate)}.{" "}
              </strong>
            )}
          </div>
        ) : (
          <div>You are not subscribed to any plan.</div>
        )}
      </CardContent>
      <CardFooter></CardFooter>
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
