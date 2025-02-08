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
  verifications: {
    label: "Verifications",
  },
} satisfies ChartConfig

export function VerificationsChart() {
  const [{ interval }] = useFilter() // read-only
  const { start, end } = prepareInterval(interval)

  // this is prefetched from the server
  const [data] = api.analytics.getVerifications.useSuspenseQuery({
    start,
    end,
  })

  const chartData = data.verifications.map((v) => ({
    feature: v.featureSlug,
    verifications: v.count,
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
            There is no data available for the selected interval.
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <Button size={"sm"}>Start verifying data</Button>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      height={chartData.length * 50}
      className="min-h-[200px] w-full"
    >
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
          axisLine={false}
          tickFormatter={(value) => (value?.length > 15 ? `${value.slice(0, 15)}...` : value)}
        />
        <XAxis dataKey="verifications" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="verifications"
          layout="vertical"
          radius={5}
          fill="hsl(var(--chart-1))"
          maxBarSize={25}
          activeBar={{
            opacity: 0.5,
          }}
          // TODO: onclick explore details of the feature on different page
          // onClick={(data) => console.info(data)}
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
