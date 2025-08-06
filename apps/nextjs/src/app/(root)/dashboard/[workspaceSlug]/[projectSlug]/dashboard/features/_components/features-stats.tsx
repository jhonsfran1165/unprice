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
import { nFormatter } from "@unprice/db/utils"
import { BarChartBig } from "lucide-react"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

export const description = "An interactive bar chart"

const chartConfig = {
  usage: {
    label: "Usage",
    color: "var(--chart-2)",
    icon: BarChartBig,
  },
  latency: {
    label: "Latency (p95)",
    color: "var(--chart-1)",
    icon: BarChartBig,
  },
  verifications: {
    label: "Verifications",
    color: "var(--chart-3)",
    icon: BarChartBig,
  },
} satisfies ChartConfig

export function FeaturesStatsSkeleton() {
  return (
    <Card className="py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b md:flex-row">
        <div className="md:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3">
          <CardTitle>Feature usage</CardTitle>
          <CardDescription>Showing feature usage for the last.</CardDescription>
        </div>
        <div className="flex space-y-0">
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
          <BarChart
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
            <Bar dataKey="date" fill="var(--color-verifications)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function FeaturesStats() {
  const [intervalFilter] = useIntervalFilter()
  const trpc = useTRPC()
  const { data: featuresOverview } = useSuspenseQuery(
    trpc.analytics.getFeaturesOverview.queryOptions({
      intervalDays: intervalFilter.intervalDays,
    })
  )

  const filteredData = featuresOverview.data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    const daysToSubtract = intervalFilter.intervalDays
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("verifications")

  const total = React.useMemo(
    () => ({
      usage: filteredData.reduce((acc, curr) => acc + curr.usage, 0),
      // latency average not sum
      latency:
        (filteredData.reduce((acc, curr) => acc + curr.latency, 0) ?? 0) /
        (filteredData.filter((item) => item.latency).length ?? 1),
      verifications: filteredData.reduce((acc, curr) => acc + curr.verifications, 0),
    }),
    [intervalFilter.intervalDays]
  )

  return (
    <Card className="py-0">
      <CardHeader className="!p-0 flex flex-col items-stretch space-y-0 border-b md:flex-row">
        <div className="md:!py-0 flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3">
          <CardTitle>{chartConfig[activeChart].label}</CardTitle>
          <CardDescription>
            Showing feature usage for the last{" "}
            {intervalFilter.intervalDays === 90
              ? "3 months"
              : intervalFilter.intervalDays === 30
                ? "30 days"
                : intervalFilter.intervalDays === 7
                  ? "7 days"
                  : "1 day"}
          </CardDescription>
        </div>
        <div className="flex space-y-0">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              // biome-ignore lint/a11y/useButtonType: <explanation>
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted md:border-t-0 md:border-l md:px-8 md:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="line-clamp-1 text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="font-bold text-lg leading-none md:text-3xl">
                  {nFormatter(total[key as keyof typeof total])} {key === "latency" ? "ms" : ""}
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
            data={filteredData}
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
