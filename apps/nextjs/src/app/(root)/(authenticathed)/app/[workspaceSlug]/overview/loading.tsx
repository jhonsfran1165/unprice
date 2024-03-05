import Link from "next/link"

import { Button } from "@builderai/ui/button"
import { Add } from "@builderai/ui/icons"

import { ProjectCardSkeleton } from "../_components/project-card"

export const runtime = "edge"

export default function Loading() {
  return (
    <>
      <div className="flex w-full justify-end">
        <Link href={`/`} aria-disabled>
          <Button className="h-8 w-8" size={"icon"}>
            <Add className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="relative">
        <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </ul>
      </div>
    </>
  )
}
