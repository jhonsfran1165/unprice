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
  usage: {
    label: "Usage",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function UsageChart() {
  const [intervalFilter] = useIntervalFilter()
  const trpc = useTRPC()
  const { data: usage, isLoading } = useSuspenseQuery(
    trpc.analytics.getUsage.queryOptions({
      intervalDays: intervalFilter.intervalDays,
    })
  )

  const chartData = usage.usage.map((v) => ({
    feature: v.featureSlug,
    usage: v.sum,
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
            There is no usage available for the selected interval.
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <CodeApiSheet defaultMethod="reportUsage">
              <Button size={"sm"} disabled={isLoading}>
                <Code className="mr-2 h-4 w-4" />
                Start usage
              </Button>
            </CodeApiSheet>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    )
  }

  const maxHeight = 400
  const height = Math.min(chartData.length * 60, maxHeight)

  return (
    <ChartContainer config={chartConfig} height={height} className="min-h-[200px] w-full">
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
        <XAxis dataKey="usage" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar
          dataKey="usage"
          layout="vertical"
          radius={5}
          fill="var(--color-usage)"
          maxBarSize={30}
          activeBar={{
            opacity: 0.5,
          }}
          // TODO: onclick explore details of the feature on different page
          // onClick={(data) => console.info(data)}
        >
          <LabelList
            dataKey="usage"
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
