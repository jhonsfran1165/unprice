import { api } from "~/trpc/server"
import { DeleteProject } from "./_components/delete-project"
import { TransferProjectToPersonal } from "./_components/transfer-to-personal"
import { TransferProjectToTeam } from "./_components/transfer-to-team"

export default async function DangerZonePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <>
      <TransferProjectToPersonal projectSlug={props.params.projectSlug} />
      <DeleteProject
        projectSlug={props.params.projectSlug}
        workspaceSlug={props.params.workspaceSlug}
      />

      <TransferProjectToTeam
        workspacesPromise={api.workspaces.listWorkspaces()}
        workspaceSlug={props.params.workspaceSlug}
        projectSlug={props.params.projectSlug}
      />
    </>
  )
}
