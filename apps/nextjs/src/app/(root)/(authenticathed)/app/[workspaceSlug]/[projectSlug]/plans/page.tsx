import { z } from "zod"

import { DataTable } from "~/components/data-table/data-table"
import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import TabsNav from "~/components/layout2/tabs-nav"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { NewPlanDialog } from "./_components/new-plan"
import { columns } from "./_components/table/columns"

const searchParamsSchema = z.object({
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
})

export default async function PlansPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { projectSlug, workspaceSlug } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  const parsed = searchParamsSchema.safeParse(props.searchParams)

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
          module="project"
          submodule="plans"
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
