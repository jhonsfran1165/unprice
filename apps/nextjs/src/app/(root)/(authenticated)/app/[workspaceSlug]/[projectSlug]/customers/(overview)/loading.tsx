import { Button } from "@builderai/ui/button"
import { Plus } from "lucide-react"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { CustomerDialog } from "../_components/customer-dialog"

export default function Loading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="All customers from your project"
          description="Manage your customers, add new customers, update plans and more."
          action={
            <CustomerDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Customer
              </Button>
            </CustomerDialog>
          }
        />
      }
    >
      <DataTableSkeleton />
    </DashboardShell>
  )
}
