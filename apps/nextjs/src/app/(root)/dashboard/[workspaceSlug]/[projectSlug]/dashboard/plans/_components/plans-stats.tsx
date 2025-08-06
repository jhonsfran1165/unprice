"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Activity, DollarSign, Users } from "lucide-react"
import StatsCards from "~/components/analytics/stats-cards"
import { useTRPC } from "~/trpc/client"

export const iconsPlansStats = {
  totalPlans: DollarSign,
  totalSubscriptions: Activity,
  totalPlanVersions: Users,
  totalFeatures: Users,
}

const PlansStats = () => {
  const trpc = useTRPC()
  const { data: stats } = useSuspenseQuery(trpc.analytics.getPlansStats.queryOptions())

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
