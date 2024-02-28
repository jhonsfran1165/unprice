import { searchDataParamsSchema } from "@builderai/db/validators"

import { DataTable } from "~/components/data-table/data-table"
import { api } from "~/trpc/server"
import { columns } from "../../_components/table/columns"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default async function WorkspaceMembersPage(props: {
  params: { workspaceSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    workspaceSlug: props.params.workspaceSlug,
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    filter.fromDate = parsed.data.fromDate
    filter.toDate = parsed.data.toDate
  }

  const { members } = await api.workspaces.listMembers(filter)

  return (
    <div className="flex flex-col">
      <DataTable
        columns={columns}
        data={members}
        filterOptions={{
          filterBy: "name",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </div>
  )
}
