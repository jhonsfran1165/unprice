"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { analytics } from "@unprice/analytics/client"
import { Checkbox } from "@unprice/ui/checkbox"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"

type PlanConversion = Awaited<ReturnType<typeof analytics.getPlansConversion>>["data"][number]

export const columns: ColumnDef<PlanConversion>[] = [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{formatDate(row.original.date.getTime())}</div>
    ),
    enableResizing: true,
  },
  {
    accessorKey: "page_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Page" />,
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.page_id}</div>,
    enableSorting: false,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "plan_version_id",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Version" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{row.original.plan_version_id}</div>
    ),
    filterFn: (row, _id, value) => {
      if (value === undefined) return true
      return row.original.plan_version_id.toLowerCase().includes(value.toLowerCase())
    },
    size: 20,
  },
  {
    accessorKey: "plan_views",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.plan_views}</div>,
    size: 20,
  },
  {
    accessorKey: "plan_clicks",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clicks" />,
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.plan_clicks}</div>,
    size: 20,
  },
  {
    accessorKey: "plan_signups",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Signups" />,
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{row.original.plan_signups}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "conversion",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Conversion" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{row.original.conversion.toFixed(2)}%</div>
    ),
    size: 20,
  },
]
