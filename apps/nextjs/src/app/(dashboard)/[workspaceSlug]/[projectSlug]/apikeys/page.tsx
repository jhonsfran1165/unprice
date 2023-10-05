import { api } from "~/trpc/server"
import { DataTable } from "./data-table"
import { NewApiKeyDialog } from "./new-api-key-dialog"

// TODO: use edge, not possible cuz custom files in the api
export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
}) {
  // TODO: handling error
  const apiKeys = await api.apikey.listApiKeys.query({
    projectSlug: props.params.projectSlug,
  })

  return (
    <>
      <NewApiKeyDialog projectSlug={props.params.projectSlug} />
      <DataTable data={apiKeys} />
    </>
  )
}
