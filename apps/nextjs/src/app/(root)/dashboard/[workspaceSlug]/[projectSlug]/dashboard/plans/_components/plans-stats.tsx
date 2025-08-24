"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Calculator, Combine, GalleryHorizontalEnd, Users } from "lucide-react"
import StatsCards, { StatsSkeleton } from "~/components/analytics/stats-cards"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

export const iconsPlansStats = {
  totalPlans: Calculator,
  totalSubscriptions: Users,
  totalPlanVersions: GalleryHorizontalEnd,
  totalFeatures: Combine,
}

export const PlansStatsSkeleton = ({ isLoading }: { isLoading?: boolean }) => {
  return (
    <StatsSkeleton
      stats={Object.entries({
        totalPlans: {
          title: "Total Revenue",
        },
        totalSubscriptions: {
          title: "Total Subscriptions",
        },
        totalPlanVersions: {
          title: "Total Plan Versions",
        },
        totalFeatures: {
          title: "New Customers",
        },
      }).map(([key]) => {
        return {
          title: key,
        }
      })}
      isLoading={isLoading}
    />
  )
}
const PlansStats = () => {
  const trpc = useTRPC()
  const [interval] = useIntervalFilter()
  const { data: stats, isLoading } = useSuspenseQuery(
    trpc.analytics.getPlansStats.queryOptions({ interval: interval.name })
  )

  if (isLoading || !stats.stats) {
    return <PlansStatsSkeleton isLoading={isLoading} />
  }

  const statsCards = Object.entries(stats.stats).map(([key, value]) => {
    return {
      total: value.total,
      unit: value.unit,
      icon: iconsPlansStats[key as keyof typeof iconsPlansStats],
      title: value.title,
      description: value.description,
    }
  })

  return <StatsCards stats={statsCards} />
}

export default PlansStats
