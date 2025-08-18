"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { nFormatter } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { BarChart4, Code } from "lucide-react"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { CodeApiSheet } from "~/components/code-api-sheet"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

const chartConfig = {
  verifications: {
    label: "Verifications",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function VerificationsChart() {
  const [intervalFilter] = useIntervalFilter()
  const trpc = useTRPC()
  const { data: verifications, isLoading } = useSuspenseQuery(
    trpc.analytics.getVerifications.queryOptions({
      start: intervalFilter.start,
      end: intervalFilter.end,
    })
  )

  const chartData = verifications.verifications.map((v) => ({
    feature: v.featureSlug,
    verifications: v.count,
    p50_latency: v.p50_latency,
    p95_latency: v.p95_latency,
    p99_latency: v.p99_latency,
  }))

  if (chartData.length === 0 || isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[420px]" isLoading={isLoading}>
          <EmptyPlaceholder.Icon>
            <BarChart4 className="h-8 w-8" />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>No data available</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            There is no data available for the selected interval.
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <CodeApiSheet defaultMethod="verifyFeature">
              <Button size={"sm"} disabled={isLoading}>
                <Code className="mr-2 h-4 w-4" />
                Start verifying data
              </Button>
            </CodeApiSheet>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} height={chartData.length * 50} className="w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{
          left: 40,
          right: 30,
          top: 10,
          bottom: 10,
        }}
        barGap={5}
        barCategoryGap={3}
      >
        <YAxis
          dataKey="feature"
          type="category"
          tickLine={false}
          tickMargin={10}
          width={120}
          axisLine={false}
          tickFormatter={(value) => (value?.length > 15 ? `${value.slice(0, 15)}...` : value)}
        />
        <XAxis dataKey="verifications" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar
          dataKey="verifications"
          layout="vertical"
          radius={5}
          fill="var(--color-verifications)"
          maxBarSize={25}
          activeBar={{ opacity: 0.5 }}
        >
          <LabelList
            dataKey="verifications"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(value: number) => nFormatter(value)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
