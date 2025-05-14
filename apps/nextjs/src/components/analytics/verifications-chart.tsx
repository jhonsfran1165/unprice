"use client"

import { nFormatter, nFormatterTime } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { BarChart4 } from "lucide-react"
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useFilter } from "~/hooks/use-filter"
import { api } from "~/trpc/client"

const chartConfig = {
  verifications: {
    label: "Verifications",
  },
  p95_latency: {
    label: "P95 Latency",
  },
  max_latency: {
    label: "Max Latency",
  },
  latest_latency: {
    label: "Latest Latency",
  },
} satisfies ChartConfig

export function VerificationsChart() {
  const [{ interval }] = useFilter() // read-only

  // this is prefetched from the server
  const [data] = api.analytics.getVerifications.useSuspenseQuery({
    range: interval,
  })

  const chartData = data.verifications.map((v) => ({
    feature: v.featureSlug,
    verifications: v.count,
    p95_latency: v.p95_latency,
    max_latency: v.max_latency,
    latest_latency: v.latest_latency,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[390px]">
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

  // Custom formatter for the tooltip
  function tooltipFormatter(
    value: number,
    name: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    _props: any,
    _index: number,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    payload: any
  ) {
    // Only show the custom content for the verifications bar
    if (name === "verifications") {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Verifications:</span>{" "}
            {nFormatter(payload.verifications)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">P95 Latency:</span>{" "}
              {nFormatterTime(payload.p95_latency)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Max Latency:</span>{" "}
              {nFormatterTime(payload.max_latency)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Latest Latency:</span>{" "}
              {nFormatterTime(payload.latest_latency)}
            </div>
          </div>
        </div>
      )
    }
    // fallback for other bars (if any)
    return value
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
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
          formatter={tooltipFormatter}
        />
        <Bar
          dataKey="verifications"
          layout="vertical"
          radius={5}
          fill="hsl(var(--chart-1))"
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
