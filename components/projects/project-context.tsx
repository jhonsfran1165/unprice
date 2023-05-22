"use client"

import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import useProject from "@/lib/swr/use-project"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProjectContext() {
  const { orgSlug, projectSlug, orgData } = useStore()
  const { project, isLoading } = useProject({
    revalidateOnFocus: false,
    orgSlug,
    projectSlug,
  })

  // TODO: loading state
  return (
    <>
      {isLoading ? null : (
        <div className="hidden items-center justify-start md:flex">
          <Separator
            orientation="vertical"
            className="mx-5 hidden h-6 rotate-[30deg] gap-0 text-background-textContrast md:inline-block"
          />
          <Link href={`/org/${orgSlug}/project/${project?.slug}`}>
            <span className="block truncate text-sm font-bold">
              {project?.name}
              <Badge className="mx-2 primary h-5 text-xs">
                {orgData?.tier}
              </Badge>
            </span>
          </Link>
        </div>
      )}
    </>
  )
}
