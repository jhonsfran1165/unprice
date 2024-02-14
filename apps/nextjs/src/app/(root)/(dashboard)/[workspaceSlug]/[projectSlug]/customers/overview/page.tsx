import { z } from "zod"

import { columns } from "~/app/(root)/(dashboard)/[workspaceSlug]/[projectSlug]/customers/_components/table/columns"
import { DataTable } from "~/components/data-table/data-table"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { UserForm } from "../_components/user-form"

const searchParamsSchema = z.object({
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
})

export default async function ProjectUsersPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { projectSlug } = props.params

  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
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

  const { customers } = await api.subscriptions.listCustomersByProject(filter)

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-end">
        <UserForm projectSlug={projectSlug} mode="create" />
      </div>
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
