"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@builderai/api"
import { Checkbox } from "@builderai/ui/checkbox"

import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"

export const columns: ColumnDef<
  RouterOutputs["subscriptions"]["listByPlanVersion"]["subscriptions"][number]
>[] = [
  {
    id: "select",
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div className="lowercase">{row.original.id}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="w-[80px]">{row.original.id}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creation Date" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("createdAt"))}</div>,
    enableSorting: true,
    enableHiding: true,
  },
]
