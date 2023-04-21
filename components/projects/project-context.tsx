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
            className="mx-5 hidden h-6 rotate-[30deg] gap-0 text-background-textContrast md:inline-block"
          />
          <span className="block truncate text-sm font-bold">
            {project?.name}
          </span>
        </div>
      )}
    </>
  )
}
