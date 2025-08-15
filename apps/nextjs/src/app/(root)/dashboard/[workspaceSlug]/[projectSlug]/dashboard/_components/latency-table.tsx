"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
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
      cellWidths={["20rem", "20rem", "20rem", "20rem", "20rem", "20rem", "12rem"]}
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
    })
  )

  // group by region deleting the date and sum the count, p50_latency, p95_latency, p99_latency
  // TODO: here I'm measuring the latency incorrectly, fix it
  const groupedByRegion = useMemo(
    () =>
      verifications?.verifications.reduce(
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
          acc[region].p50_latency += curr.p50_latency
          acc[region].p95_latency += curr.p95_latency
          acc[region].p99_latency += curr.p99_latency

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
    <DataTable
      columns={columns}
      data={data}
      filterOptions={{
        filterBy: "region",
        filterColumns: true,
        filterDateRange: false,
        filterServerSide: false,
      }}
    />
  )
}
