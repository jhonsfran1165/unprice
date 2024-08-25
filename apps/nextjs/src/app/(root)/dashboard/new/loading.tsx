import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { Skeleton } from "@unprice/ui/skeleton"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function Loading() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <Card className="max-w-lg" variant="ghost">
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
            <CardDescription>Create a new workspace to get started.</CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="mx-auto h-10 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
