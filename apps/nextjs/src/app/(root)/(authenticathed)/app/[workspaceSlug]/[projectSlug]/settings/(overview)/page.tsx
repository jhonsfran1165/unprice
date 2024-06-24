import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@builderai/ui/card"
import { Label } from "@builderai/ui/label"
import { Skeleton } from "@builderai/ui/skeleton"
import { api } from "~/trpc/server"
import { RegisterAccountForm } from "../_components/register-account-form"
import { RenameProjectForm } from "../_components/rename-project"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project name</CardTitle>
        <CardDescription>Change the display name of your project</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="space-y-2">
              <Label>Name</Label>
              <Skeleton className="h-[38px] w-full" />
              <div className="flex pt-4">
                <Skeleton className="primary ml-auto h-[38px] w-[56px]" />
              </div>
            </div>
          }
        >
          <RenameProjectForm
            projectPromise={api.projects.getBySlug({
              slug: props.params.projectSlug,
            })}
          />

          <RegisterAccountForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
