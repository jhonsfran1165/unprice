import { Button } from "@unprice/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@unprice/ui/card"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <DashboardShell
      header={<HeaderTab title="General Settings" description="Manage your workspace settings" />}
    >
      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Workspace Name</CardTitle>
          <CardDescription>Change the name of your workspace</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Delete
          </Button>
        </CardFooter>
      </Card>
      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Delete</CardTitle>
          <CardDescription>This will delete the workspace and all of its data.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" className="text-transparent">
            Delete
          </Button>
        </CardFooter>
      </Card>
    </DashboardShell>
  )
}
