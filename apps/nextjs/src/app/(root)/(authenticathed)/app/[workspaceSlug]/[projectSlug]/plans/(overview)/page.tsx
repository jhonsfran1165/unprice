import Balancer from "react-wrap-balancer"

import { userCanAccessProject } from "~/lib/project-guard"
import { api } from "~/trpc/server"
import { PlanCard, PlanCardSkeleton } from "./_components/plan-card"

export default async function PlansPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { projectSlug, workspaceSlug } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["FREE", "PRO"],
  })

  const { plans } = await api.plans.listByActiveProject({})

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PlanCard
              plan={plan}
              workspaceSlug={workspaceSlug}
              projectSlug={projectSlug}
            />
          </li>
        ))}
      </ul>

      {plans.length === 0 && (
        <div className="relative">
          <ul className="grid select-none grid-cols-1 gap-4 opacity-40 lg:grid-cols-3">
            <PlanCardSkeleton pulse={false} />
            <PlanCardSkeleton pulse={false} />
            <PlanCardSkeleton pulse={false} />
          </ul>
          <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center">
            <Balancer>
              <h2 className="text-2xl font-bold">
                This project has no plans yet
              </h2>
              <p className="text-lg text-muted-foreground">
                Create your first plan to get started
              </p>
            </Balancer>
          </div>
        </div>
      )}
    </>
  )
}
