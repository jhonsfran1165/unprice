"use client"

import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProjectContext() {
  const { projectData } = useStore()

  return (
    <>
      {!projectData ? null : (
        <div className="hidden items-center justify-start md:flex">
          <Separator
            orientation="vertical"
            className="mx-5 hidden h-6 rotate-[30deg] gap-0 text-background-textContrast md:inline-block"
          />
          <Link
            href={`/org/${projectData?.org_slug}/project/${projectData?.project_slug}`}
          >
            <span className="block truncate text-sm font-bold">
              {projectData?.project_name}
              <Badge className="mx-2 primary h-5 text-xs">
                {projectData?.tier}
              </Badge>
            </span>
          </Link>
        </div>
      )}
    </>
  )
}
