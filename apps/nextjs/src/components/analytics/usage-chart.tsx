"use client"

import { BarChart4 } from "lucide-react"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import { prepareInterval } from "@unprice/tinybird"
import { Button } from "@unprice/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useFilter } from "~/hooks/use-filter"
import { nFormatter } from "~/lib/nformatter"
import { api } from "~/trpc/client"

const chartConfig = {
  usage: {
    label: "Usage",
  },
} satisfies ChartConfig

export function UsageChart() {
  const [{ interval }] = useFilter() // read-only
  const { start, end } = prepareInterval(interval)

  // this is prefetched from the server
  const [data] = api.analytics.getUsage.useSuspenseQuery({
    start,
    end,
  })

  const chartData = data.usage.map((v) => ({
    feature: v.featureSlug,
    usage: v.sum,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[300px]">
          <EmptyPlaceholder.Icon>
            <BarChart4 className="h-8 w-8" />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>No data available</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            There is no usage available for the selected interval.
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <Button size={"sm"}>Start usage</Button>
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
          left: 20,
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
          axisLine={false}
          tickFormatter={(value) => (value?.length > 15 ? `${value.slice(0, 15)}...` : value)}
        />
        <XAxis dataKey="usage" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="usage"
          layout="vertical"
          radius={5}
          fill="hsl(var(--chart-1))"
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
