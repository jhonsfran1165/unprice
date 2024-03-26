import { Plus } from "lucide-react"

import { Button } from "@builderai/ui/button"

import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import SidebarNav from "~/components/layout/sidebar"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"
import { UserDialog } from "./_components/user-dialog"

export default function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params
  const tabs = Object.values(PROJECT_TABS_CONFIG)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Users & Subscriptions"
          description="Manage your users and subscriptions."
          action={
            <UserDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </UserDialog>
          }
        />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.customers}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
      sidebar={
        <SidebarNav
          activeTab={PROJECT_TABS_CONFIG.customers}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
