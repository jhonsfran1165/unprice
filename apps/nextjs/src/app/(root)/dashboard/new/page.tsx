import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import NewWorkspaceForm from "../_components/new-workspace-form"

export default async function PageSuccess() {
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
