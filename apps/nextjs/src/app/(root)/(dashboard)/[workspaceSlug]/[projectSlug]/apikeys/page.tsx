import { Suspense } from "react"
import dynamic from "next/dynamic"

import { Button } from "@builderai/ui/button"

import HeaderSubTab from "~/components/header-subtab"
import { userCanAccessProject } from "~/lib/project-guard"
import DataTable from "./data-table"
import ApiKeysSkeleton from "./data-table-skeleton"

const NewApiKeyDialog = dynamic(() => import("./new-api-key-dialog"), {
  ssr: false,
  loading: () => <Button className="button-primary">Create API Key</Button>,
})

export default async function ApiKeysPage(props: {
  params: { projectSlug: string; workspaceSlug: string }
}) {
  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
  })

  return (
    <>
      <HeaderSubTab
        title="Api keys generated"
        description="All the apis of the system"
        action={<NewApiKeyDialog projectSlug={props.params.projectSlug} />}
      />
      <Suspense fallback={<ApiKeysSkeleton />}>
        <DataTable projectSlug={props.params.projectSlug} />
      </Suspense>
    </>
  )
}
