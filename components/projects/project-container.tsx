"use client"

import useProjects from "@/lib/swr/use-projects"
import { ProjectCard } from "@/components/projects/project-card"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

import NoProjectsPlaceholder from "./no-projects-placeholder"
import { ProjectSkeleton } from "./project-skeleton"

export function ProjectsContainer({ loading }) {
  const { projects, isLoading } = useProjects({
    revalidateOnFocus: true,
  })

  const loadingProgress = isLoading || loading
  const noProjectHolder = loadingProgress === false && projects?.length === 0

  return (
    <MaxWidthWrapper className="pt-10">
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {loadingProgress
          ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
          : projects &&
            projects.length > 0 &&
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
      </ul>
      {noProjectHolder && <NoProjectsPlaceholder />}
    </MaxWidthWrapper>
  )
}
