"use client"

import useProjects from "@/lib/swr/use-projects"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/projects/project-card"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

import NoProjectsPlaceholder from "./no-projects-placeholder"
import { ProjectDialog } from "./project-dialog"
import { ProjectSkeleton } from "./project-skeleton"
import { useState } from "react"

export function ProjectsContainer({ loading }) {
  const { projects, isLoading } = useProjects({
    revalidateOnFocus: true,
  })
  const [open, setOpen] = useState(false)

  const loadingProgress = isLoading || loading
  const noProjectHolder = loadingProgress === false && projects?.length === 0

  return (
    <MaxWidthWrapper className="pt-10">
      <ProjectDialog
        open={open}
        setOpen={setOpen}
        dialogTrigger={
          <Button className="button-primary text-xs" size="sm">
            Create a new project
          </Button>
        }
      />
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {loadingProgress
          ? Array.from({ length: 6 }).map((_, i) => <div className="mt-10"><ProjectSkeleton key={i} /></div>)
          : projects &&
            projects.length > 0 &&
            projects.map((project) => (
              <div key={project.project_id} className="mt-10">
                <ProjectCard project={project} />
              </div>
            ))}
      </ul>
      {noProjectHolder && <NoProjectsPlaceholder />}
    </MaxWidthWrapper>
  )
}