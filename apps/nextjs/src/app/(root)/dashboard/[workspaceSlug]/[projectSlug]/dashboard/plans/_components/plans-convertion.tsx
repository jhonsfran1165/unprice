"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { DataTable } from "~/components/data-table/data-table"
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton"
import { useIntervalFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"
import { columns } from "./table/columns"

export function PlansConversionSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={8}
      showDateFilterOptions={true}
      showViewOptions={true}
      searchableColumnCount={1}
      cellWidths={["10rem", "30rem", "20rem", "20rem", "20rem", "20rem", "12rem"]}
      shrinkZero
    />
  )
}

export function PlansConversion() {
  const trpc = useTRPC()
  const [intervalFilter] = useIntervalFilter()

  const { data: plansConversion } = useSuspenseQuery(
    trpc.analytics.getPlansConversion.queryOptions({
      intervalDays: intervalFilter.intervalDays,
    })
  )

  return (
    <DataTable
      columns={columns}
      data={plansConversion?.data ?? []}
      filterOptions={{
        filterBy: "plan_version_id",
        filterColumns: true,
        filterDateRange: false,
        filterServerSide: false,
      }}
    />
  )
}
