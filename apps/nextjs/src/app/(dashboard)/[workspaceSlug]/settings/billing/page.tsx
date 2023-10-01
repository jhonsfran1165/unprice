import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

import { DashboardShell } from "~/app/(dashboard)/_components/dashboard-shell"
import { api } from "~/trpc/server"
import { SubscriptionForm } from "./subscription-form"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default function BillingPage() {
  return (
    <DashboardShell
      title="Billing"
      description="Manage your subscription and billing details"
      className="space-y-4"
    >
      <SubscriptionCard />

      <UsageCard />
    </DashboardShell>
  )
}

async function SubscriptionCard() {
  const subscription = await api.auth.mySubscription.query()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <p>
            You are currently on the <strong>{subscription.plan}</strong> plan.
            Your subscription will renew on{" "}
            <strong>
              {subscription.billingPeriodEnd &&
                new Date(subscription.billingPeriodEnd).toDateString()}
            </strong>
            .
          </p>
        ) : (
          <p>You are not subscribed to any plan.</p>
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
