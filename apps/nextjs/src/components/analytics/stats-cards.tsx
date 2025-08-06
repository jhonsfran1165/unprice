import { Card, CardContent, CardHeader, CardTitle } from "@unprice/ui/card"
import { Skeleton } from "@unprice/ui/skeleton"
import type { LucideIcon } from "lucide-react"
import { NumberTicker } from "./number-ticker"

type StatsProps = {
  total: number
  unit?: string
  icon: LucideIcon
  title: string
  description: string
}

export const StatsSkeleton = ({
  stats,
}: {
  stats: {
    title: string
  }[]
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="my-1 h-[28px] w-24" />
              <p className="text-muted-foreground text-xs">from current billing period</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const StatsCards = ({ stats }: { stats: StatsProps[] }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const hasDecimalPlaces = stat.total % 1 !== 0
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 font-bold text-2xl">
                <NumberTicker
                  value={stat.total}
                  decimalPlaces={hasDecimalPlaces ? 2 : 0}
                  startValue={0}
                />
                {stat.unit && <span>{stat.unit}</span>}
              </div>
              <p className="text-muted-foreground text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default StatsCards
