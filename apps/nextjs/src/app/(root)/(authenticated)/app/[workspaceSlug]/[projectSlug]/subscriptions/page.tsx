import { searchDataParamsSchema } from "@builderai/db/validators"

import { DataTable } from "~/components/data-table/data-table"
import { api } from "~/trpc/server"
import { columns } from "./_components/table/columns"

export default async function CustomerVersionPage(props: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const parsed = searchDataParamsSchema.safeParse(props.searchParams)

  const filter = {
    projectSlug: props.params.projectSlug,
    fromDate: undefined as number | undefined,
    toDate: undefined as number | undefined,
  }

  if (parsed?.success) {
    filter.fromDate = parsed.data.fromDate
    filter.toDate = parsed.data.toDate
  }

  const { subscriptions } = await api.subscriptions.listByPlanVersion({
    planVersionId: props.params.planVersionId,
  })

  return (
    <div className="overflow-hidden">
      <div className="flex flex-col">
        <DataTable
          columns={columns}
          data={subscriptions}
          filterOptions={{
            filterBy: "email",
            filterColumns: true,
            filterDateRange: true,
          }}
        />
      </div>
    </div>
  )
}
