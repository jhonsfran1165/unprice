import { Suspense } from "react"

import { Button } from "@builderai/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"

import { DashboardShell } from "~/app/(dashboard)/_components/dashboard-shell"
import { userCanAccess } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { DeleteProject } from "./delete-project"
import { TransferProjectToOrganization } from "./transfer-to-organization"
import { TransferProjectToPersonal } from "./transfer-to-personal"

export default async function DangerZonePage(props: {
  params: { projectSlug: string; workspaceSlug: string }
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  return (
    <DashboardShell
      title="Danger Zone"
      description="Do dangerous stuff here"
      className="space-y-4"
    >
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
              <Button variant="destructive">Transfer to Organization</Button>
            </CardFooter>
          </Card>
        }
      >
        <TransferProjectToOrganization
          orgsPromise={api.auth.listOrganizations.query()}
        />
      </Suspense>
      <TransferProjectToPersonal />
      <DeleteProject />
    </DashboardShell>
  )
}
