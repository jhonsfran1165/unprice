import Link from "next/link"
import { Balancer } from "react-wrap-balancer"

import { Button } from "@builderai/ui/button"
import { Add, Warning } from "@builderai/ui/icons"

import { api } from "~/trpc/server"
import { ProjectCard, ProjectCardSkeleton } from "../_components/project-card"

export const preferredRegion = ["fra1"]
export const runtime = "edge"

export default async function WorkspaceOverviewPage(props: {
  params: { workspaceSlug: string }
}) {
  const { projects, limitReached } =
    await api.project.listByActiveWorkspace.query()

  return (
    <>
      <div className="flex w-full justify-end">
        {limitReached ? (
          <Button className="min-w-max" variant="ghost">
            <Warning className="h-5 w-5" />
            <span className="pl-2">Project limit reached</span>
          </Button>
        ) : (
          <Link href={`/onboarding`}>
            <Button className="min-w-max">
              <Add className="h-5 w-5" />
              <span className="pl-2">Create a new project</span>
            </Button>
          </Link>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard
              project={project}
              workspaceSlug={props.params.workspaceSlug}
            />
          </li>
        ))}
      </ul>

      {projects.length === 0 && (
        <div className="relative">
          <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
            <ProjectCardSkeleton pulse={false} />
            <ProjectCardSkeleton pulse={false} />
            <ProjectCardSkeleton pulse={false} />
          </ul>
          <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center">
            <Balancer>
              <h2 className="text-2xl font-bold">
                This workspace has no projects yet
              </h2>
              <p className="text-lg text-muted-foreground">
                Create your first project to get started
              </p>
            </Balancer>
          </div>
        </div>
      )}
    </>
  )
}
