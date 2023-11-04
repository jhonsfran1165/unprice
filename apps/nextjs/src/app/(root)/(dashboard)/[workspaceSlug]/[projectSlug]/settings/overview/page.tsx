import { Suspense } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@builderai/ui/card"
import { Label } from "@builderai/ui/label"
import { Skeleton } from "@builderai/ui/skeleton"

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { RenameProjectForm } from "../_components/rename-project"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccessProject({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project name</CardTitle>
        <CardDescription>
          Change the display name of your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <>
              <Label>asdasd</Label>
              <Skeleton className="h-[38px] w-full" />
            </>
          }
        >
          <RenameProjectForm
            project={await api.project.bySlug.query({
              slug: props.params.projectSlug,
            })}
          />
        </Suspense>
      </CardContent>
    </Card>
  )
}
