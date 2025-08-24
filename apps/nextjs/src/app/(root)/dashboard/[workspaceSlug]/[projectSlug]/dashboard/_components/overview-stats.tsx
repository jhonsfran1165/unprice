"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, DollarSign, Users } from "lucide-react"
import StatsCards, { StatsSkeleton } from "~/components/analytics/stats-cards"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

export const iconsOverviewStats = {
  totalRevenue: DollarSign,
  newSignups: Users,
  newSubscriptions: Activity,
  newCustomers: Users,
}

export const OverviewStatsSkeleton = () => {
  return (
    <StatsSkeleton
      stats={Object.entries({
        totalRevenue: {
          title: "Total Revenue",
        },
        newSignups: {
          title: "New Signups",
        },
        newSubscriptions: {
          title: "New Subscriptions",
        },
        newCustomers: {
          title: "New Customers",
        },
      }).map(([key]) => {
        return {
          title: key,
        }
      })}
    />
  )
}

const OverviewStats = () => {
  const trpc = useTRPC()
  const [interval] = useIntervalFilter()
  const { data: stats, isLoading } = useQuery(
    trpc.analytics.getOverviewStats.queryOptions({ interval: interval.name })
  )

  if (!stats || isLoading) {
    return <OverviewStatsSkeleton />
  }

  const statsCards = Object.entries(stats.stats).map(([key, value]) => {
    return {
      total: value.total,
      unit: value.unit,
      icon: iconsOverviewStats[key as keyof typeof iconsOverviewStats],
      title: value.title,
      description: value.description,
    }
  })

  return <StatsCards stats={statsCards} />
}

export default OverviewStats
