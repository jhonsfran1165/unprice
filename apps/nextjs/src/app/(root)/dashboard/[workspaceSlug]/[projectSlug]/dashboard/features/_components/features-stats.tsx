"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"

import { useSuspenseQuery } from "@tanstack/react-query"
import { BarChart3, BarChartBig } from "lucide-react"
import { NumberTicker } from "~/components/analytics/number-ticker"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useIntervalQueryInvalidation } from "~/hooks/use-interval-invalidation"
import { useTRPC } from "~/trpc/client"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"

export const description = "An interactive bar chart"

const chartConfig = {
  usage: {
    label: "Usage",
    color: "var(--chart-4)",
    icon: BarChartBig,
  },
  latency: {
    label: "Latency",
    color: "var(--chart-1)",
    icon: BarChartBig,
  },
  verifications: {
    label: "Verifications",
    color: "var(--chart-3)",
    icon: BarChartBig,
  },
} satisfies ChartConfig

export function FeaturesStatsSkeleton({
  isLoading,
  error,
}: {
  isLoading: boolean
  error?: string
}) {
  const [intervalFilter] = useIntervalFilter()
  return (
    <Card className="py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b md:flex-row">
        <div className="md:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 md:w-1/2">
          <CardTitle>Verifications</CardTitle>
          <CardDescription>
            Showing consumption behavior for the {intervalFilter.label}
          </CardDescription>
        </div>
        <div className="flex space-y-0 md:w-1/2">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              // biome-ignore lint/a11y/useButtonType: <explanation>
              <button
                key={Math.random()}
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
        <EmptyPlaceholder className="min-h-[250px]" isLoading={isLoading}>
          <EmptyPlaceholder.Icon>
            <BarChart3 className="h-8 w-8" />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>
            {error ? "Ups, something went wrong" : "No data available"}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {error
              ? error
              : `There is no data available for the ${intervalFilter.label}. Please try again later.`}
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      </CardContent>
    </Card>
  )
}

export function FeaturesStats() {
  const [intervalFilter] = useIntervalFilter()
  const trpc = useTRPC()

  const {
    data: featuresOverview,
    isLoading,
    dataUpdatedAt,
    isFetching,
  } = useSuspenseQuery(
    trpc.analytics.getFeaturesOverview.queryOptions(
      {
        intervalDays: intervalFilter.intervalDays,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
      }
    )
  )

  // invalidate the query when the interval changes
  useIntervalQueryInvalidation({
    currentInterval: intervalFilter.intervalDays,
    dataUpdatedAt,
    isFetching,
    getQueryKey: (interval) => [
      ["analytics", "getFeaturesOverview"],
      {
        input: {
          intervalDays: interval,
        },
        type: "query",
      },
    ],
  })

  const chartData = featuresOverview.data

  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("verifications")

  const total = React.useMemo(
    () => ({
      usage: chartData.reduce((acc, curr) => acc + curr.usage, 0),
      // latency average not sum - if nan then 0
      latency:
        chartData.reduce((acc, curr) => acc + curr.latency, 0) /
        (chartData.filter((item) => item.latency).length || 1),
      verifications: chartData.reduce((acc, curr) => acc + curr.verifications, 0),
    }),
    [intervalFilter.intervalDays, chartData.length]
  )

  if (isLoading || !chartData || chartData.length === 0) {
    return <FeaturesStatsSkeleton isLoading={isLoading} error={featuresOverview.error} />
  }

  return (
    <Card className="py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b md:flex-row">
        <div className="md:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 md:w-1/2">
          <CardTitle>{chartConfig[activeChart].label}</CardTitle>
          <CardDescription>
            Showing consumption behavior for the {intervalFilter.label}
          </CardDescription>
        </div>
        <div className="flex space-y-0 md:w-1/2">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              // biome-ignore lint/a11y/useButtonType: <explanation>
              <button
                key={Math.random()}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted md:border-t-0 md:border-l md:px-8 md:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="line-clamp-1 text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="flex items-center gap-1 font-bold text-lg leading-none sm:text-3xl">
                  <NumberTicker
                    value={total[key as keyof typeof total]}
                    startValue={0}
                    decimalPlaces={0}
                    withFormatter={true}
                    isTime={key === "latency"}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 md:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
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
                if (intervalFilter.intervalDays === 1) {
                  return date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }

                return date.toLocaleDateString("en-US", {
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
                    if (intervalFilter.intervalDays === 1) {
                      return date.toLocaleTimeString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }

                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
