"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { analytics } from "@unprice/analytics/client"
import { regionsCloudflare } from "@unprice/analytics/utils"
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

function Pill({ label, value }: { label: string | undefined; value: string | undefined }) {
  if (!label || !value) return <div className="px-4 font-medium text-sm">{label}</div>
  return (
    <div className="inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-md border bg-background-base font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3">
      <div className="border-r py-0.5 pr-1 pl-2">{label}</div>
      <div className="py-0.5 pr-2 pl-1 font-mono">{value}</div>
    </div>
  )
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
      const region = row.original.region.toUpperCase()
      const regionData = regionsCloudflare[region]

      if (!regionData) return <div className="px-4 font-medium text-sm">{region}</div>

      return (
        <div className="flex items-center px-4">
          <Pill label={regionData.flag} value={regionData.location} />
        </div>
      )
    },
    filterFn: (row, _id, value) => {
      const region = row.original.region.toUpperCase()

      if (value.includes("All")) return true

      return Array.isArray(value) && value.includes(region)
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
    size: 400,
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
