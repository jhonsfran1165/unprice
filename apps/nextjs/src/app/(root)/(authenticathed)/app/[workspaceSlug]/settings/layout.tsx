import { Button } from "@builderai/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@builderai/ui/dialog"

import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import SidebarMenuSubTabs from "~/components/layout2/menu-siderbar-subtabs"
import TabsNav from "~/components/layout2/tabs-nav"
import SidebarNav from "~/components/sidebar"
import { InviteMemberForm } from "./_components/invite-member-dialog"

// TODO: find a way to add invite member button without adding too much bundle to the layout
export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { workspaceSlug } = props.params

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="General Settings"
          description="Manage your workspace settings"
          action={
            <Dialog>
              <DialogTrigger asChild>
                <Button className="self-end">Invite member</Button>
              </DialogTrigger>
              <DialogContent>
                <InviteMemberForm />
              </DialogContent>
            </Dialog>
          }
        />
      }
      tabs={
        <TabsNav
          module="workspace"
          submodule="settings"
          basePath={`/${workspaceSlug}`}
        />
      }
      sidebar={
        <SidebarNav
          module="workspace"
          submodule="settings"
          basePath={`/${workspaceSlug}`}
        />
      }
      sidebartabs={
        <SidebarMenuSubTabs
          module="workspace"
          submodule="settings"
          basePath={`/${workspaceSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
