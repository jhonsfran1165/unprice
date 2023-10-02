import Link from "next/link"
import { Balancer } from "react-wrap-balancer"

import { Button } from "@builderai/ui/button"

import { DashboardShell } from "~/components/dashboard-shell"
import { api } from "~/trpc/server"
import { ProjectCard } from "../_components/project-card"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default async function Page(props: {
  params: { workspaceSlug: string }
}) {
  // TODO: get limits of this project for this workspace
  const { projects, limitReached } =
    await api.project.listByActiveWorkspace.query()

  return (
    <DashboardShell
      title="Projects"
      description="Projects for this workspace will show up here"
      headerAction={
        limitReached ? (
          <Button className="min-w-max" variant={"ghost"}>
            Project limit reached
          </Button>
        ) : (
          <Button className="min-w-max" asChild>
            <Link href={`/onboarding`}>Create a new project</Link>
          </Button>
        )
      }
    >
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
            <ProjectCard.Skeleton pulse={false} />
            <ProjectCard.Skeleton pulse={false} />
            <ProjectCard.Skeleton pulse={false} />
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
    </DashboardShell>
  )
}
