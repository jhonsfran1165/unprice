import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SubscriptionForm } from "../../_components/subscriptions/subscription-form"

export default async function NewSubscriptionPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <Card variant="ghost" className="w-full">
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
            <CardDescription>Create a new workspace to get started.</CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <SubscriptionForm
              defaultValues={{
                customerId: "",
                phases: [],
                timezone: "UTC",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
