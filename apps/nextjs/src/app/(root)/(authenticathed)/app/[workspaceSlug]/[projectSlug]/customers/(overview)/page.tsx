import { searchDataParamsSchema } from "@builderai/db/validators"

import { columns } from "~/app/(root)/(authenticathed)/app/[workspaceSlug]/[projectSlug]/customers/_components/table/columns"
import { DataTable } from "~/components/data-table/data-table"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
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

  const { customers } = await api.customers.listByActiveProject(filter)

  return (
    <div className="flex flex-col">
      <DataTable
        columns={columns}
        data={customers}
        filterOptions={{
          filterBy: "email",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </div>
  )
}
