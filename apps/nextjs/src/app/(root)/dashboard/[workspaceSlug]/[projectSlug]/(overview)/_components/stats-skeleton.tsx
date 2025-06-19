import { Card, CardContent, CardHeader, CardTitle } from "@unprice/ui/card"
import { Skeleton } from "@unprice/ui/skeleton"
import { Activity, CreditCard, DollarSign, Users } from "lucide-react"

const StatsSkeleton = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="my-1 h-[28px] w-24" />
          <p className="text-muted-foreground text-xs">from current billing period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">New Subscriptions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="my-1 h-[28px] w-24" />
          <p className="text-muted-foreground text-xs">from current billing period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">New Signups</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="my-1 h-[28px] w-24" />
          <p className="text-muted-foreground text-xs">from current billing period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm"> Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="my-1 h-[28px] w-24" />
          <p className="text-muted-foreground text-xs">from current billing period</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatsSkeleton
