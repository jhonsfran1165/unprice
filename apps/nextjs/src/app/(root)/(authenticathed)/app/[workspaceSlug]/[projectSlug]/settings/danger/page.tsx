import { Suspense } from "react"

import { Button } from "@builderai/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@builderai/ui/card"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { DeleteProject } from "./delete-project"
import { TransferProjectToPersonal } from "./transfer-to-personal"
import { TransferProjectToTeam } from "./transfer-to-team"

export default async function DangerZonePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
  })

  return (
    <>
      <TransferProjectToPersonal projectSlug={props.params.projectSlug} />
      <DeleteProject
        projectSlug={props.params.projectSlug}
        workspaceSlug={props.params.workspaceSlug}
      />

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Transfer to Team</CardTitle>
              <CardDescription className="flex items-center">
                Transfer this project to team
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                className="animate-pulse text-transparent"
                disabled={true}
              >
                <LoadingAnimation />
              </Button>
            </CardFooter>
          </Card>
        }
      >
        <TransferProjectToTeam
          workspacesPromise={api.workspaces.listWorkspaces()}
          workspaceSlug={props.params.workspaceSlug}
          projectSlug={props.params.projectSlug}
        />
      </Suspense>
    </>
  )
}
