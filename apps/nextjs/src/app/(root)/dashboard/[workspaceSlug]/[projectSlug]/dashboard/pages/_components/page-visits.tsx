"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@unprice/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
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
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={[]}
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
            />
            <ChartTooltip
              content={<ChartTooltipContent className="w-[200px]" nameKey="date" labelKey="date" />}
            />
            <Line dataKey="date" fill="var(--color-desktop)" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function PageVisits() {
  const trpc = useTRPC()
  const [pageFilter] = usePageFilter()
  const [intervalFilter] = useIntervalFilter()

  const { data: pageVisits } = useSuspenseQuery(
    trpc.analytics.getPagesOverview.queryOptions(
      {
        intervalDays: intervalFilter.intervalDays,
        pageId: pageFilter.pageId,
      },
      {
        enabled: !!pageFilter.pageId,
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
    [intervalFilter.intervalDays]
  )

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
              // biome-ignore lint/a11y/useButtonType: <explanation>
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="font-bold text-lg leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
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
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
