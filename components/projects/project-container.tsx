"use client"

import { useEffect, useState } from "react"

import useProjects from "@/lib/swr/use-projects"
import { ProjectsApiResult } from "@/lib/types/supabase"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectSkeleton } from "@/components/projects/project-skeleton"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"
import NoProjectsPlaceholder from "./no-projects-placeholder"

export function ProjectsContainer({ isLoading }: { isLoading?: boolean }) {
  const { projects: data } = useProjects({
    revalidateOnFocus: false,
  })
  const [projects, setProjects] = useState<ProjectsApiResult[] | undefined>([])

  useEffect(() => {
    setProjects(data)
  }, [data])

  return (
    <MaxWidthWrapper className="pt-10">
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectSkeleton isLoading={true} key={i} />
            ))}
          </div>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      ) : (
        <NoProjectsPlaceholder />
      )}
    </MaxWidthWrapper>
  )
}
