import dynamic from "next/dynamic"
import { z } from "zod"

import { Button } from "@builderai/ui/button"

import { DataTable } from "~/components/data-table/data-table"
import HeaderSubTab from "~/components/header-subtab"
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
const searchParamsSchema = z.object({
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
})
export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
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

  const { apikeys } = await api.apikeys.listApiKeys(filter)

  return (
    <>
      <HeaderSubTab
        title="Api keys generated"
        description="All the apis of the system"
        action={<NewApiKeyDialog projectSlug={props.params.projectSlug} />}
      />
      <DataTable
        columns={columns}
        data={apikeys}
        filterOptions={{
          filterBy: "name",
          filterColumns: true,
          filterDateRange: true,
        }}
      />
    </>
  )
}