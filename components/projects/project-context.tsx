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
        <div className="hidden items-center justify-start md:flex">
          <Icons.divider className="mx-2 hidden h-6 w-6 gap-0 text-background-text md:inline-block" />
          <span className="block truncate text-sm font-bold">
            {project?.name}
          </span>
        </div>
      )}
    </>
  )
}
