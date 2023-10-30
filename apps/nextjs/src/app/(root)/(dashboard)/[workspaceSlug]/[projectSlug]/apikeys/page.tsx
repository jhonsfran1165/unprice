import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"

import HeaderSubTab from "~/components/header-subtab"
import { userCanAccess } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import ApiKeysSkeleton from "./data-table-skeleton"

const DataTable = dynamic(() => import("./data-table"), {
  ssr: false,
  loading: ApiKeysSkeleton,
})

const NewApiKeyDialog = dynamic(() => import("./new-api-key-dialog"), {
  ssr: false,
  loading: () => <Button className="button-primary">Create API Key</Button>,
})

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
    <>
      <HeaderSubTab
        title="Api keys generated"
        description="All the apis of the system"
        action={<NewApiKeyDialog projectSlug={props.params.projectSlug} />}
      />

      <DataTable data={apiKeys} projectSlug={props.params.projectSlug} />
    </>
  )
}
