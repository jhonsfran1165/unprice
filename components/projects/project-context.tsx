"use client"

import { useStore } from "@/lib/stores/layout"
import useProject from "@/lib/swr/use-project"
import { Icons } from "@/components/shared/icons"

export default function ProjectContext() {
  const { orgSlug, projectSlug } = useStore()
  const { project, isLoading } = useProject({
    revalidateOnFocus: false,
    orgSlug,
    projectSlug,
  })

  return (
    <>
      {isLoading ? null : (
        <div className="hidden md:flex items-center justify-start">
          <Icons.divider className="hidden h-6 w-6 mx-2 text-background-text gap-0 md:inline-block" />
          <span className="block truncate text-sm font-bold">
            {project?.name}
          </span>
        </div>
      )}
    </>
  )
}
