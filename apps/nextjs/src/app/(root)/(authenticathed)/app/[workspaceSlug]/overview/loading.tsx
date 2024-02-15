import Link from "next/link"

import { Button } from "@builderai/ui/button"
import { LoadingAnimation } from "@builderai/ui/loading-animation"

import { ProjectCardSkeleton } from "../_components/project-card"

export default function Loading() {
  return (
    <>
      <div className="flex w-full justify-end">
        <Link href={`/`} aria-disabled>
          <Button className="min-w-max" disabled>
            <LoadingAnimation variant={"inverse"} className="h-5 w-5" />
            <span className="pl-2">Create a new project</span>
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
