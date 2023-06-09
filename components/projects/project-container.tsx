"use client"

import useProjects from "@/lib/swr/use-projects"
import { ProjectCard } from "@/components/projects/project-card"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

import NoProjectsPlaceholder from "./no-projects-placeholder"
import { ProjectSkeleton } from "./project-skeleton"
import { AddProjectDialog } from "./add-project-dialog"

export function ProjectsContainer({ loading }) {
  const { projects, isLoading } = useProjects({
    revalidateOnFocus: true,
  })

  const loadingProgress = isLoading || loading
  const noProjectHolder = loadingProgress === false && projects?.length === 0

  return (
    <MaxWidthWrapper className="pt-10">
      <AddProjectDialog cta="Add new project" />
      <ul className="mt-10 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {loadingProgress
          ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
          : projects &&
            projects.length > 0 &&
            projects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
      </ul>
      {noProjectHolder && <NoProjectsPlaceholder />}
    </MaxWidthWrapper>
  )
}
