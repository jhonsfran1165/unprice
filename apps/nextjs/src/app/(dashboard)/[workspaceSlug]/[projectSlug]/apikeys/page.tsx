import { DashboardShell } from "~/components/dashboard-shell"
import { userCanAccess } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { DataTable } from "./data-table"
import { NewApiKeyDialog } from "./new-api-key-dialog"

// TODO: use edge, not possible cuz custom files in the api
export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  // TODO: handling error
  const apiKeys = await api.apikey.listApiKeys.query({
    projectSlug: props.params.projectSlug,
  })

  return (
    <DashboardShell
      title="API Keys"
      description="Manage your API Keys"
      headerAction={<NewApiKeyDialog projectSlug={props.params.projectSlug} />}
    >
      <DataTable data={apiKeys} />
    </DashboardShell>
  )
}
