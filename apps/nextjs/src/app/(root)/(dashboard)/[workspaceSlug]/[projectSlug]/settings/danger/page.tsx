import { Suspense } from "react"

import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { DeleteProject } from "./delete-project"
import { TransferProjectToOrganization } from "./transfer-to-organization"
import { TransferProjectToPersonal } from "./transfer-to-personal"

export default async function DangerZonePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
  })

  return (
    <>
      <TransferProjectToPersonal />
      <DeleteProject />

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Transfer to Organization</CardTitle>
              <CardDescription className="flex items-center">
                Transfer this project to an organization
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                className="animate-pulse text-transparent"
                disabled={true}
              >
                <LoadingAnimation variant={"destructive"} />
              </Button>
            </CardFooter>
          </Card>
        }
      >
        <TransferProjectToOrganization
          orgsPromise={api.auth.listOrganizations.query()}
        />
      </Suspense>
    </>
  )
}
