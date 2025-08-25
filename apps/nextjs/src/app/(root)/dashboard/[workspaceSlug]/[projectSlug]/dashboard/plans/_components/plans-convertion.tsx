"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useIntervalQueryInvalidation } from "~/hooks/use-interval-invalidation"
import { useTRPC } from "~/trpc/client"
import { ANALYTICS_STALE_TIME } from "~/trpc/shared"
import { columns } from "./table/columns"

export function PlansConversionSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={7}
      showDateFilterOptions={false}
      showViewOptions={true}
      searchableColumnCount={1}
      cellWidths={["10rem", "10rem", "10rem", "10rem", "10rem", "10rem", "12rem"]}
      shrinkZero
    />
  )
}

export function PlansConversion() {
  const trpc = useTRPC()
  const [intervalFilter] = useIntervalFilter()

  const {
    data: plansConversion,
    isLoading,
    dataUpdatedAt,
    isFetching,
  } = useSuspenseQuery(
    trpc.analytics.getPlansConversion.queryOptions(
      {
        intervalDays: intervalFilter.intervalDays,
      },
      {
        staleTime: ANALYTICS_STALE_TIME,
      }
    )
  )

  // invalidate the query when the interval changes
  useIntervalQueryInvalidation({
    currentInterval: intervalFilter.intervalDays,
    dataUpdatedAt,
    isFetching,
    getQueryKey: (interval) => [
      ["analytics", "getPlansConversion"],
      {
        input: {
          intervalDays: interval,
        },
        type: "query",
      },
    ],
  })

  if (isLoading) {
    return <PlansConversionSkeleton />
  }

  return (
    <DataTable
      columns={columns}
      data={plansConversion.data}
      error={plansConversion.error}
      filterOptions={{
        filterBy: "plan_version_id",
        filterColumns: true,
        filterDateRange: false,
        filterServerSide: false,
      }}
    />
  )
}
