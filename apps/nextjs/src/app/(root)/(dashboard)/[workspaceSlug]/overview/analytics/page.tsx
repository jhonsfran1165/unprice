import { Suspense } from "react"

import { ProjectCardSkeleton } from "../../_components/project-card"
import { Projects } from "../../_components/project-dashboard"

export const runtime = "edge"

export default function WorkspaceOverviewPage(props: {
  params: { workspaceSlug: string }
}) {
  // TODO: add react-boundary error boundary
  return (
    <Suspense
      fallback={
        <div className="relative">
          <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </ul>
        </div>
      }
    >
      <Projects workspaceSlug={props.params.workspaceSlug} />
    </Suspense>
  )
}
