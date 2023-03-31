"use client"

import { useEffect, useState } from "react"

import useProject from "@/lib/swr/use-project"
import { Project } from "@/lib/types/supabase"
import { Icons } from "@/components/shared/icons"

export default function ProjectContext() {
  const [project, setProject] = useState<Project>()
  const { project: data } = useProject({
    revalidateOnFocus: false,
  })

  useEffect(() => {
    setProject(data)
  }, [data])

  return (
    <div>
      {project ? (
        <div className="hidden md:flex items-center justify-start">
          <Icons.divider className="hidden h-6 w-6 mx-2 text-background-text gap-0 md:inline-block" />
          <span className="block truncate text-sm font-bold">
            {project?.name}
          </span>
        </div>
      ) : null}
    </div>
  )
}
