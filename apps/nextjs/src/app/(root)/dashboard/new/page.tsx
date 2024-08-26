import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { UserIcon } from "lucide-react"
import { Suspense } from "react"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import LayoutLoader from "~/components/layout/layout-loader"
import { api } from "~/trpc/server"
import NewWorkspaceForm from "../_components/new-workspace-form"
import Redirect from "./_components/redirect"

export default function PageSuccess(props: {
  searchParams: {
    customer_id: string
  }
}) {
  const { customer_id } = props.searchParams

  return (
    <Suspense fallback={<LayoutLoader />}>
      <Content customerId={customer_id} />
    </Suspense>
  )
}

async function Content({
  customerId,
}: {
  customerId: string
}) {
  if (!customerId) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center">
          <Card className="max-w-lg" variant="ghost">
            <CardHeader>
              <CardTitle>Create Workspace</CardTitle>
              <CardDescription>Create a new workspace to get started.</CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <NewWorkspaceForm
                defaultValues={{
                  name: "",
                  planVersionId: "",
                  config: [],
                  successUrl: "",
                  cancelUrl: "",
                  // TODO: This is the project id for the unprice-admin project
                  projectId: "proj_uhV7tetPJwCZAMox3L7Po4H5dgc",
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
