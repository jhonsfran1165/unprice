import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { Skeleton } from "@builderai/ui/skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"

export default function WorkSpaceSettingsDangerLoading() {
  return (
    <DashboardShell
      header={<HeaderTab title="General Settings" description="Manage your workspace settings" />}
    >
      <Card className="animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          You are currently on the {<Skeleton className="inline h-[15px] w-[30px]" />} plan.
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button className="text-transparent">Manage Subscription</Button>
        </CardFooter>
      </Card>
      <Card className="mt-4 animate-pulse bg-muted">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>TODO</CardContent>
      </Card>
    </DashboardShell>
  )
}
