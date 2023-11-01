import { ProjectCardSkeleton } from "../_components/project-card"

export default function Loading() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </ul>
  )
}
