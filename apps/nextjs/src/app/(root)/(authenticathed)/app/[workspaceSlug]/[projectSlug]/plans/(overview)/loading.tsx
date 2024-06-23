import { Button } from "@builderai/ui/button"
import { Plus } from "lucide-react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { PlanDialog } from "../_components/plan-dialog"
import { PlanCardSkeleton } from "./_components/plan-card"

export default function Loading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Plans"
          description="Create and manage your plans"
          action={
            <PlanDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </PlanDialog>
          }
        />
      }
    >
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
    </DashboardShell>
  )
}
