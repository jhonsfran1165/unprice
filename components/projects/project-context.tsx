"use client"

import { useStore } from "@/lib/stores/layout"
import useProject from "@/lib/swr/use-project"
import { Separator } from "@/components/ui/separator"

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
          <Separator
            orientation="vertical"
            className="ml-5 mr-5 hidden h-6 gap-0 text-background-textContrast md:inline-block rotate-[30deg]"
          />
          <span className="block truncate text-sm font-bold">
            {project?.name}
          </span>
        </div>
      )}
    </>
  )
}
