import { COOKIES_APP } from "@unprice/config"
import { analytics } from "@unprice/tinybird/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { UserIcon } from "lucide-react"
import { cookies } from "next/headers"
import { Suspense } from "react"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import LayoutLoader from "~/components/layout/layout-loader"
import { api } from "~/trpc/server"
import NewWorkspaceForm from "../_components/new-workspace-form"
import Redirect from "./_components/redirect"

export default async function NewPage(props: {
  searchParams: {
    customer_id?: string
  }
}) {
  const { customer_id } = props.searchParams
  const cookieStore = cookies()
  const sessionId = cookieStore.get(COOKIES_APP.SESSION)?.value

  if (!sessionId) {
    return (
      <Suspense fallback={<LayoutLoader />}>
        <Content customerId={customer_id} />
      </Suspense>
    )
  }

  const data = await analytics.getPlanClickBySessionId({
    session_id: sessionId,
    action: "plan_click",
  })

  const session = data.data.at(0)

  return (
    <Suspense fallback={<LayoutLoader />}>
      <Content
        customerId={customer_id}
        planVersionId={session?.payload.plan_version_id}
        sessionId={sessionId}
      />
    </Suspense>
  )
}

async function Content({
  customerId,
  planVersionId,
  sessionId,
}: {
  customerId?: string
  planVersionId?: string
  sessionId?: string
}) {
  if (!customerId || customerId === "") {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center">
          <Card className="max-w-xl" variant="ghost">
            <CardHeader>
              <CardTitle>Create Workspace</CardTitle>
              <CardDescription>Create a new workspace to get started.</CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <NewWorkspaceForm
                defaultValues={{
                  name: "",
                  // preselect the plan version if it exists
                  planVersionId: planVersionId ?? "",
                  config: [],
                  successUrl: "",
                  cancelUrl: "",
                  sessionId: sessionId,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  const { customer } = await api.customers.getById({
    id: customerId,
  })

  if (!customer) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center">
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon>
              <UserIcon className="size-8" />
            </EmptyPlaceholder.Icon>
            <EmptyPlaceholder.Title>Customer not found</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              The customer with the id {customerId} was not found.
            </EmptyPlaceholder.Description>
          </EmptyPlaceholder>
        </div>
      </DashboardShell>
    )
  }

  // create the workspace
  const newWorkspace = await api.workspaces.create({
    id: customer.metadata?.externalId,
    name: customer.name,
    unPriceCustomerId: customer.id,
  })

  return <Redirect url={newWorkspace.workspace.slug} />
}
