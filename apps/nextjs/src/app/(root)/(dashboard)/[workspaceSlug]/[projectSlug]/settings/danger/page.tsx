import { Suspense } from "react"

import { userCanAccess } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { DeleteProject } from "./delete-project"
import { TransferProjectToOrganization } from "./transfer-to-organization"
import { TransferProjectToPersonal } from "./transfer-to-personal"

export default async function DangerZonePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  return (
    <>
      <Suspense>
        <TransferProjectToOrganization
          orgsPromise={api.auth.listOrganizations.query()}
        />
      </Suspense>

      <TransferProjectToPersonal />
      <DeleteProject />
    </>
  )
}
