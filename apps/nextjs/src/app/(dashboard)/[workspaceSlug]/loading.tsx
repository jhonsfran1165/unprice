import { Button } from "@builderai/ui/button"

import { DashboardShell } from "~/components/dashboard-shell"
import { ProjectCard } from "./_components/project-card"

export default function Loading() {
  return (
    <DashboardShell
      title="Projects"
      description="Projects for this workspace will show up here"
      headerAction={<Button disabled>Create a new project</Button>}
    >
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ProjectCard.Skeleton />
        <ProjectCard.Skeleton />
        <ProjectCard.Skeleton />
      </ul>
    </DashboardShell>
  )
}
