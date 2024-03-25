import { PlanCardSkeleton } from "./_components/plan-card"

export const runtime = "edge"

export default function Loading() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <li>
        <PlanCardSkeleton />
      </li>
      <li>
        <PlanCardSkeleton />
      </li>
      <li>
        <PlanCardSkeleton />
      </li>
    </ul>
  )
}
