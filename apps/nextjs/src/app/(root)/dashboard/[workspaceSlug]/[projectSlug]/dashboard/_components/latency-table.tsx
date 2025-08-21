"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { Typography } from "@unprice/ui/typography"
import { useMemo } from "react"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"
import { type VerificationsMetricsGrouped, columns } from "./latency/columns"

export function LatencyTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={7}
      showDateFilterOptions={false}
      showViewOptions={true}
      searchableColumnCount={1}
      cellWidths={["16rem", "16rem", "16rem", "16rem", "16rem", "16rem", "12rem"]}
      shrinkZero
    />
  )
}

export function LatencyTable() {
  const trpc = useTRPC()
  const [intervalFilter] = useIntervalFilter()

  const { data: verifications } = useSuspenseQuery(
    trpc.analytics.getVerificationRegions.queryOptions({
      intervalDays: intervalFilter.intervalDays,
      region: "All",
    })
  )

  // group by region deleting the date and sum the count, p50_latency, p95_latency, p99_latency
  const groupedByRegion = useMemo(
    () =>
      verifications.verifications.reduce(
        (acc, curr) => {
          if (!curr.region) return acc
          const region = curr.region

          if (!acc[region]) {
            acc[region] = {
              region,
              count: curr.count,
              p50_latency: curr.p50_latency,
              p95_latency: curr.p95_latency,
              p99_latency: curr.p99_latency,
              trend: [],
            }
          }

          acc[region].count += curr.count
          // for this latency value I'll take the max value
          acc[region].p50_latency = Math.max(acc[region].p50_latency, curr.p50_latency)
          acc[region].p95_latency = Math.max(acc[region].p95_latency, curr.p95_latency)
          acc[region].p99_latency = Math.max(acc[region].p99_latency, curr.p99_latency)

          return acc
        },
        {} as Record<string, VerificationsMetricsGrouped>
      ),
    [intervalFilter.intervalDays]
  )

  const data = Object.values(groupedByRegion).map((region) => {
    return {
      ...region,
      trend: verifications?.verifications.filter((v) => v.region === region.region),
    }
  })

  return (
    <div className="mt-4">
      <div className="flex flex-col px-1 py-4">
        <Typography variant="h3" affects="removePaddingMargin">
          Latency by region
        </Typography>
        <Typography variant="p" affects="removePaddingMargin">
          Latency by region for the {intervalFilter.label}
        </Typography>
      </div>
      <DataTable
        columns={columns}
        data={data}
        error={verifications.error}
        filterOptions={{
          filterBy: "region",
          filterColumns: true,
          filterDateRange: false,
          filterSelectors: {
            region: [
              {
                label: "All",
                value: "All",
              },
            ],
          },
          filterServerSide: false,
        }}
      />
    </div>
  )
}
