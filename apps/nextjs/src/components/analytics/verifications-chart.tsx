"use client"

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { nFormatter } from "@unprice/db/utils"
import { Button } from "@unprice/ui/button"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@unprice/ui/chart"
import { BarChart4, Code } from "lucide-react"
import * as React from "react"
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
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const {
    data: verifications,
    isLoading,
    isFetching,
  } = useSuspenseQuery(
    trpc.analytics.getVerifications.queryOptions({
      intervalDays: intervalFilter.intervalDays,
    })
  )

  const chartData = verifications.verifications.map((v) => ({
    feature: v.featureSlug,
    verifications: v.count,
    p50_latency: v.p50_latency,
    p95_latency: v.p95_latency,
    p99_latency: v.p99_latency,
  }))

  // invalidate when data points change
  React.useEffect(() => {
    const invalidate = async () => {
      // invalidate queries when interval changes if the data changed for the current interval
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey0 = query.queryKey[0] as string[]

          // only invalidate if the query is for the verifications
          if (queryKey0.join(".") !== "analytics.getVerifications") return false

          const queryKey1 = query.queryKey[1] as {
            type: string
            input: {
              intervalDays: number
            }
          }

          // only invalidate if the interval days is different
          if (queryKey1.input.intervalDays !== intervalFilter.intervalDays) {
            return true
          }

          return false
        },
      })
    }

    invalidate()
  }, [isFetching])

  if (chartData.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[420px]" isLoading={isLoading}>
          <EmptyPlaceholder.Icon>
            <BarChart4 className="h-8 w-8" />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>
            {verifications.error ? "Unable to load data" : "No data available"}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {verifications.error
              ? verifications.error
              : "There is no data available for the selected interval."}
          </EmptyPlaceholder.Description>
          {!verifications.error && (
            <EmptyPlaceholder.Action>
              <CodeApiSheet defaultMethod="verifyFeature">
                <Button size={"sm"} disabled={isLoading}>
                  <Code className="mr-2 h-4 w-4" />
                  Start verifying data
                </Button>
              </CodeApiSheet>
            </EmptyPlaceholder.Action>
          )}
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
