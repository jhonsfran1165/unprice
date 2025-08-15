"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { analytics } from "@unprice/analytics/client"
import { TableCellNumber } from "~/components/data-table/data-table-cell-number"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { ChartLineRegion } from "../chart-line-region"

export type VerificationsMetrics = Awaited<
  ReturnType<typeof analytics.getFeaturesVerificationRegions>
>["data"][number]

export type VerificationsMetricsGrouped = {
  region: string
  count: number
  p50_latency: number
  p95_latency: number
  p99_latency: number
  trend: VerificationsMetrics[]
}

export const columns: ColumnDef<VerificationsMetricsGrouped>[] = [
  {
    accessorKey: "region",
    header: () => <div className="px-4">Region</div>,
    enableSorting: false,
    enableHiding: false,
    size: 10,
    meta: {
      cellClassName: "px-4",
      headerClassName: "px-4",
    },
    cell: ({ row }) => {
      return <div className="px-4 font-medium text-sm">{row.original.region}</div>
    },
  },
  {
    accessorKey: "trend",
    header: "Trend",
    cell: ({ row }) => {
      return <ChartLineRegion trend={row.original.trend} className="h-[50px]" />
    },
    enableSorting: false,
    enableHiding: false,
    size: 300,
  },
  {
    accessorKey: "p50",
    header: ({ column }) => <DataTableColumnHeader column={column} title="P50" />,
    cell: ({ row }) => {
      return <TableCellNumber value={row.original.p50_latency} unit="ms" />
    },
    enableHiding: false,
    size: 10,
  },
  {
    accessorKey: "p90",
    header: ({ column }) => <DataTableColumnHeader column={column} title="P90" />,
    cell: ({ row }) => {
      return <TableCellNumber value={row.original.p95_latency} unit="ms" />
    },
    enableHiding: false,
    size: 10,
  },
  {
    accessorKey: "p99",
    header: ({ column }) => <DataTableColumnHeader column={column} title="P99" />,
    cell: ({ row }) => {
      return <TableCellNumber value={row.original.p99_latency} unit="ms" />
    },
    enableHiding: false,
    size: 10,
  },
]
