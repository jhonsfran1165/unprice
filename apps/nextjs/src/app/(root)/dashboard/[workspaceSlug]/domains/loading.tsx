import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardHeader } from "@unprice/ui/card"
import { Skeleton } from "@unprice/ui/skeleton"
import { Plus } from "lucide-react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { DomainDialog } from "./_components/domain-dialog"

export default function DomainPageLoading() {
  return (
    <DashboardShell
      header={
        <HeaderTab
          title="Domains"
          description="Domains for this workspace"
          action={
            <DomainDialog>
              <Button>
                <Plus className="mr-2 size-4" />
                Create Domain
              </Button>
            </DomainDialog>
          }
        />
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-row items-center">
              <Skeleton className="h-6 w-[150px]" />

              <Skeleton className="ml-2 h-6 w-6" />

              <Skeleton className="ml-2 w-[200px] rounded-md" />
            </div>

            <div className="flex flex-row items-center justify-between space-x-2">
              <Skeleton className="h-6 w-[50px]" />

              <Skeleton className="h-6 w-[50px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-background-bg p-4" />
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
