"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Button } from "@unprice/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { BarChart3 } from "lucide-react"
import { useParams } from "next/navigation"
import { NumberTicker } from "~/components/analytics/number-ticker"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { SuperLink } from "~/components/super-link"
import { useIntervalFilter, usePageFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

const chartConfig = {
  desktop_visits: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile_visits: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
  other_visits: {
    label: "Other",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const LoadingSkeleton = () => {
  return (
    <div className="flex h-[250px] w-full items-center justify-center">
      <LoadingAnimation className="size-6" />
    </div>
  )
}

export function PageVisitsSkeleton() {
  return (
    <Card className="py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b md:flex-row">
        <div className="md:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 md:w-1/2">
          <CardTitle>Page visits</CardTitle>
          <CardDescription>Showing page visits for the last 3 months</CardDescription>
        </div>
        <div className="flex space-y-0 md:w-1/2">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              // biome-ignore lint/a11y/useButtonType: <explanation>
              <button
                key={chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted md:border-t-0 md:border-l md:px-8 md:py-6"
              >
                <span className="line-clamp-1 text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="font-bold text-lg leading-none md:text-3xl">0</span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 md:p-6">
        <div className="flex h-[250px] w-full items-center justify-center">
          <LoadingSkeleton />
        </div>
      </CardContent>
    </Card>
  )
}

export function PageVisits() {
  const trpc = useTRPC()
  const [pageFilter] = usePageFilter()
  const [intervalFilter] = useIntervalFilter()
  const params = useParams()

  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const basePath = `/${workspaceSlug}/${projectSlug}`

  // only get the number of published pages
  const { data: publishedPages, isLoading: isLoadingPublishedPages } = useQuery(
    trpc.pages.listByActiveProject.queryOptions(
      {},
      {
        // only get the number of published pages
        select: (data) => {
          const publishedPages = data.pages.filter((page) => page.published === true)
          return {
            publishedPages: publishedPages.length,
            totalPages: data.pages.length,
          }
        },
      }
    )
  )

  const { data: pageVisits } = useSuspenseQuery(
    trpc.analytics.getPagesOverview.queryOptions(
      {
        intervalDays: intervalFilter.intervalDays,
        pageId: pageFilter.pageId,
      },
      {
        enabled: !!pageFilter.pageId && pageFilter.pageId !== "",
        staleTime: 1000 * 60 * 1, // 1 minute
      }
    )
  )

  const chartData = pageVisits.data

  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("desktop_visits")

  const total = React.useMemo(
    () => ({
      desktop_visits: chartData.reduce((acc, curr) => acc + curr.desktop_visits, 0),
      mobile_visits: chartData.reduce((acc, curr) => acc + curr.mobile_visits, 0),
      other_visits: chartData.reduce((acc, curr) => acc + curr.other_visits, 0),
    }),
    [intervalFilter.intervalDays, pageFilter.pageId]
  )

  // Empty state
  const hasPublishedPages = publishedPages?.publishedPages && publishedPages.publishedPages > 0

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0 md:w-1/2">
          <CardTitle>Page Views</CardTitle>
          <CardDescription>
            Showing total page views for the last{" "}
            {intervalFilter.intervalDays === 90
              ? "3 months"
              : intervalFilter.intervalDays === 30
                ? "30 days"
                : intervalFilter.intervalDays === 7
                  ? "7 days"
                  : "1 day"}
          </CardDescription>
        </div>
        <div className="flex md:w-1/2">
          {["desktop_visits", "mobile_visits", "other_visits"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              // biome-ignore lint/a11y/useButtonType: I do this because I can
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="flex items-center gap-1 font-bold text-lg leading-none sm:text-3xl">
                  <NumberTicker
                    value={total[key as keyof typeof total]}
                    startValue={0}
                    decimalPlaces={0}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {chartData.length > 0 && (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return intervalFilter.intervalDays === 1
                    ? date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="date"
                    labelKey="date"
                    labelFormatter={(_, item) => {
                      const date = new Date(item.at(0)?.payload.date)
                      if (!date) return "Invalid date"

                      return intervalFilter.intervalDays === 1
                        ? date.toLocaleTimeString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                    }}
                  />
                }
              />
              <Line
                dataKey={activeChart}
                type="monotone"
                stroke={`var(--color-${activeChart})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
        {(!hasPublishedPages || chartData.length === 0) && (
          <EmptyPlaceholder className="min-h-[250px]" isLoading={isLoadingPublishedPages}>
            <EmptyPlaceholder.Icon>
              <BarChart3 className="h-8 w-8" />
            </EmptyPlaceholder.Icon>
            <EmptyPlaceholder.Title>
              {hasPublishedPages ? "No page selected" : "No data available for this page"}
            </EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              {hasPublishedPages
                ? "Select a page to see page views"
                : "Create a page to start tracking page views"}
            </EmptyPlaceholder.Description>
            {!hasPublishedPages && (
              <EmptyPlaceholder.Action>
                <SuperLink href={`${basePath}/pages`} className="mt-2 w-full">
                  <Button size={"sm"}>Create a page</Button>
                </SuperLink>
              </EmptyPlaceholder.Action>
            )}
          </EmptyPlaceholder>
        )}
      </CardContent>
    </Card>
  )
}
