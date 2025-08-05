"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import type { Analytics } from "@unprice/analytics"
import { nFormatter } from "@unprice/db/utils"
import { Badge } from "@unprice/ui/badge"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@unprice/ui/tooltip"
import { BarChart, HelpCircle, Loader2 } from "lucide-react"
import { CodeApiSheet } from "~/components/code-api-sheet"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useTRPC } from "~/trpc/client"

type FeatureUsageEvent = Awaited<ReturnType<Analytics["getFeatureHeatmap"]>>["data"][number]

const getIntensityColor = (value: number | undefined | null): string => {
  if (value === 0 || value === undefined || value === null)
    return "hover:border-secondary-border bg-secondary-bgSubtle border-secondary-border"
  if (value <= 20) return "hover:border-secondary-border bg-secondary-bg text-secondary-text"
  if (value <= 40) return "hover:border-secondary-border bg-secondary-bgHover text-secondary-text"
  if (value <= 60) return "hover:border-secondary-border bg-secondary-bgActive text-secondary-text"
  if (value <= 80)
    return "hover:border-secondary-border bg-secondary-line text-secondary-textContrast"
  return "hover:border-secondary-border bg-secondary-solid text-secondary-textContrast"
}

const formatPlanName = (slug: string): string => {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

const FeatureUsageHeatmapEmptyState = ({ isLoading }: { isLoading?: boolean }) => {
  return (
    <EmptyPlaceholder>
      <EmptyPlaceholder.Icon>
        <BarChart className="h-8 w-8" />
      </EmptyPlaceholder.Icon>
      <EmptyPlaceholder.Title>No Data</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>There is no data available.</EmptyPlaceholder.Description>
      <EmptyPlaceholder.Action>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CodeApiSheet defaultMethod="verifyFeature">
            <Button size={"sm"}>
              <BarChart className="mr-2 h-4 w-4" />
              Start verifying data
            </Button>
          </CodeApiSheet>
        )}
      </EmptyPlaceholder.Action>
    </EmptyPlaceholder>
  )
}

export default function FeatureUsageHeatmap() {
  const trpc = useTRPC()
  const { data: featureUsageEvents, isLoading } = useSuspenseQuery(
    trpc.analytics.getFeatureHeatmap.queryOptions({
      intervalDays: 7,
    })
  )

  // Get unique plans and features
  const plans = [...new Set(featureUsageEvents?.data.map((event) => event.plan_slug))]
  const features = [...new Set(featureUsageEvents?.data.map((event) => event.feature_slug))]

  // Create lookup function for event data
  const getEventData = (planSlug: string, featureSlug: string): FeatureUsageEvent | null => {
    return (
      featureUsageEvents?.data.find(
        (event) => event.plan_slug === planSlug && event.feature_slug === featureSlug
      ) || null
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Usage by Plan</CardTitle>
        <CardDescription>
          Heatmap showing feature activity scores across different subscription plans. Activity
          Score determines how actively each feature is being used. Percentage are relative to the
          total usage of the plan in the period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {featureUsageEvents?.data.length === 0 ? (
          <FeatureUsageHeatmapEmptyState isLoading={isLoading} />
        ) : (
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header Row - Plans */}
                <div className={`grid grid-cols-${plans.length + 1} mb-4 gap-2`}>
                  <div className="flex items-center justify-center font-semibold text-sm">
                    Feature
                  </div>
                  {plans.map((planSlug) => (
                    <div
                      key={planSlug}
                      className="flex items-center justify-center gap-2 align-middle"
                    >
                      {/* TODO: add plan stats */}
                      <Tooltip key={`${planSlug}-tooltip`}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="primary"
                            className="flex items-center gap-1 font-medium"
                            asChild
                          >
                            <div className="flex items-center gap-1">
                              {formatPlanName(planSlug)}
                              <HelpCircle className="size-3 cursor-pointer font-light" />
                            </div>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={10} className="w-64">
                          <div className="space-y-2">
                            <div className="border-b pb-1 text-center font-semibold">
                              {formatPlanName(planSlug)}
                            </div>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span>Active Users:</span>
                                <span className="font-medium text-success">100</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Plan Versions:</span>
                                <span className="font-medium">100</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Subscriptions:</span>
                                <span className="font-medium">100</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Usage:</span>
                                <span className="font-medium">100</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Verifications:</span>
                                <span className="font-medium">100</span>
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>

                {/* Data Rows - Features */}
                {features.map((featureSlug) => (
                  <div key={featureSlug} className={`grid grid-cols-${plans.length + 1}`}>
                    {/* Feature Name */}
                    <div className="flex items-center justify-end align-middle">
                      <span className="mr-4 truncate font-medium text-sm">{featureSlug}</span>
                    </div>

                    {/* Plan Usage Cells */}
                    {plans.map((planSlug) => {
                      const eventData = getEventData(planSlug, featureSlug)

                      const activityScore = eventData?.activity_score

                      return (
                        <Tooltip key={`${featureSlug}-${planSlug}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex h-12 w-full cursor-pointer items-center justify-center transition-all duration-200 hover:border-2 ${getIntensityColor(activityScore)}
                              `}
                            >
                              <span className="font-medium text-xs">
                                {activityScore && activityScore > 0
                                  ? `${activityScore.toFixed(1)}%`
                                  : "—"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="w-56">
                            <div className="space-y-2">
                              <div className="border-b pb-1 text-center font-semibold">
                                {featureSlug}
                              </div>
                              <div className="text-sm">
                                <div className="flex justify-between">
                                  <span>Plan:</span>
                                  <span className="font-bold">{formatPlanName(planSlug)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Activity Score:</span>
                                  <span className="font-medium text-success">
                                    {eventData ? `${eventData.activity_score.toFixed(1)}%` : "N/A"}
                                  </span>
                                </div>
                                {eventData && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Usage Count:</span>
                                      <span className="font-medium">
                                        {nFormatter(eventData.usage_count)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Usage Sum:</span>
                                      <span className="font-medium">
                                        {nFormatter(eventData.usage_sum)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Verifications:</span>
                                      <span className="font-medium">
                                        {nFormatter(eventData.verification_count)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 mb-4 flex flex-wrap items-center gap-4">
              <span className="font-medium text-sm">Activity Score:</span>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(0)}`} />
                <span className="text-xs">No Activity (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(20)}`} />
                <span className="text-xs">Low (1-20)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(40)}`} />
                <span className="text-xs">Medium (21-40)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(60)}`} />
                <span className="text-xs">Good (41-60)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(80)}`} />
                <span className="text-xs">High (61-80)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border ${getIntensityColor(100)}`} />
                <span className="text-xs">Excellent (81-100)</span>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
