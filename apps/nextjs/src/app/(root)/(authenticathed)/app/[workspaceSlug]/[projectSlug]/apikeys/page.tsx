import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"
import { searchDataParamsSchema } from "@builderai/validators/utils"

import { DataTable } from "~/components/data-table/data-table"
import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { columns } from "./_components/table/columns"

const NewApiKeyDialog = dynamic(
  () => import("./_components/new-api-key-dialog"),
  {
    ssr: false,
    loading: () => <Button className="button-primary">Create API Key</Button>,
  }
)

export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
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

  const { apikeys } = await api.apikeys.listApiKeys(filter)

  return (
    <DataTable
      columns={columns}
      data={apikeys}
      filterOptions={{
        filterBy: "name",
        filterColumns: true,
        filterDateRange: true,
      }}
    />
  )
}
