import { searchDataParamsSchema } from "@builderai/db/validators"

import { DataTable } from "~/components/data-table/data-table"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { columns } from "../_components/table/columns"

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

  const { plans } = await api.plans.listByActiveProject(filter)

  return (
    <DataTable
      columns={columns}
      data={plans}
      filterOptions={{
        filterBy: "slug",
        filterColumns: true,
        filterDateRange: true,
      }}
    />
  )
}
