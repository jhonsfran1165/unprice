import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { notFound } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { api } from "~/trpc/server"
import { SubscriptionForm } from "../../_components/subscriptions/subscription-form"

export default async function EditSubscriptionPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    subscriptionId: string
  }
}) {
  const { subscription } = await api.subscriptions.getById({
    id: params.subscriptionId,
  })

  if (!subscription) {
    notFound()
  }

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Edit Subscription</CardTitle>
            <CardDescription>Edit the subscription.</CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <SubscriptionForm defaultValues={subscription} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
