"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  // XAxis,
  YAxis,
} from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { cn } from "@unprice/ui/utils"
import { ChartTooltipNumber } from "./chart-tooltip-number"
import type { VerificationsMetrics } from "./latency/columns"

const chartConfig = {
  p99_latency: {
    label: "Latency",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ChartLineRegion({
  className,
  trend,
}: { className?: string; trend: VerificationsMetrics[] }) {
  return (
    <ChartContainer config={chartConfig} className={cn("h-[100px] w-full", className)}>
      <LineChart
        accessibilityLayer
        data={trend}
        margin={{
          left: 12,
          bottom: 5,
          top: 5,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              className="w-[180px]"
              nameKey="region"
              labelKey="region"
              formatter={(value, name) => (
                <ChartTooltipNumber chartConfig={chartConfig} value={value} name={name} />
              )}
            />
          }
        />
        <Line
          dataKey="p99_latency"
          type="monotone"
          stroke="var(--color-p99_latency)"
          strokeWidth={2}
          dot={false}
        />
        <YAxis
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          orientation="right"
          tickFormatter={(value) => `${value}ms`}
        />
      </LineChart>
    </ChartContainer>
  )
}
