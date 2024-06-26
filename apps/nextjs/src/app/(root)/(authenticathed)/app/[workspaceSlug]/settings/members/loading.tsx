import { Button } from "@builderai/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { Skeleton } from "@builderai/ui/skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { InviteMemberDialog } from "./_components/invite-member-dialog"

export default function WorkSpaceSettingsMembersLoading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Members Settings"
          description="Manage your users for this workspace"
          action={<InviteMemberDialog workspaceSlug={""} />}
        />
      }
    >
      <Card className="bg-muted animate-pulse">
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
      <Card className="bg-muted mt-4 animate-pulse">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>TODO</CardContent>
      </Card>
    </DashboardShell>
  )
}
