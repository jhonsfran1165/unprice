import { searchDataParamsSchema } from "@builderai/validators/utils"

import { DataTable } from "~/components/data-table/data-table"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import TabsNav from "~/components/layout/tabs-nav"
import { PROJECT_TABS_CONFIG } from "~/constants/projects"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { NewPlanDialog } from "./_components/new-plan"
import { columns } from "./_components/table/columns"

export default async function PlansPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { projectSlug, workspaceSlug } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["FREE", "PRO"],
  })

  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    projectSlug: props.params.projectSlug,
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    ;(filter.fromDate = parsed.data.fromDate),
      (filter.toDate = parsed.data.toDate)
  }

  const { plans } = await api.plans.listByProject(filter)
  const tabs = Object.values(PROJECT_TABS_CONFIG)

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Plans"
          description="Create and manage your plans"
          action={<NewPlanDialog />}
        />
      }
      tabs={
        <TabsNav
          tabs={tabs}
          activeTab={PROJECT_TABS_CONFIG.plans}
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      <DataTable
        columns={columns}
        data={plans}
        filterOptions={{
          filterBy: "slug",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </DashboardShell>
  )
}
