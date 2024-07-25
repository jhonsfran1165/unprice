"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import { prepareInterval } from "@unprice/tinybird"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { useFilter } from "~/hooks/use-filter"
import { nFormatter } from "~/lib/nformatter"
import { api } from "~/trpc/client"

const chartConfig = {
  verifications: {
    label: "Verfications",
  },
} satisfies ChartConfig

export function VerificationsChart() {
  const [{ interval }] = useFilter() // read-only
  const { start, end } = prepareInterval(interval)

  // this is prefetched from the server
  const [data] = api.analytics.getAllFeatureVerificationsActiveProject.useSuspenseQuery({
    start,
    end,
  })

  const chartData = data.verifications.map((v) => ({
    feature: v.featureSlug,
    verifications: v.total,
  }))

  return (
    <div className="flex flex-col">
      <ChartContainer config={chartConfig} className="h-min[200px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: 30,
            right: 30,
          }}
        >
          <YAxis
            dataKey="feature"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value}
          />
          <XAxis dataKey="verifications" type="number" hide />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar
            dataKey="verifications"
            layout="vertical"
            radius={5}
            fill="hsl(var(--chart-1))"
            maxBarSize={40}
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

      <div className="flex gap-2 font-medium leading-none">
        Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
      </div>
      <div className="text-muted-foreground leading-none">
        Showing total verifications for the last 6 months
      </div>
    </div>
  )
}
