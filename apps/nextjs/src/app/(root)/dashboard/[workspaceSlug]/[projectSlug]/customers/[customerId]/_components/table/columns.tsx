"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@unprice/api"
import { Checkbox } from "@unprice/ui/checkbox"
import { cn } from "@unprice/ui/utils"

import { Badge } from "@unprice/ui/badge"
import { usePathname } from "next/navigation"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { SuperLink } from "~/components/super-link"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

type Subscriptions =
  RouterOutputs["customers"]["getSubscriptions"]["customer"]["subscriptions"][number]

export const columns: ColumnDef<Subscriptions>[] = [
  {
    id: "select",
    size: 50,
    accessorKey: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        disabled={
          table.getRowModel().rows.length === 0 ||
          table.getRowModel().rows.every((row) => row.original.status !== "active")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  },
  {
    accessorKey: "version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Version" />,
    cell: ({ row }) => {
      const pathname = usePathname()

      return (
        <SuperLink href={`${pathname}/${row.original.id}`} prefetch={false}>
          <div className="font-bold">
            {row.original.planVersion.title} - v{row.original.planVersion.version}
          </div>
          {row.original.planVersion.description && (
            <div className="hidden text-muted-foreground text-xs md:inline">
              {`${row.original.planVersion.description.slice(0, 40)}...`}
            </div>
          )}
        </SuperLink>
      )
    },
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
    filterFn: (row, _, filterValue) => {
      // search by title and description
      const searchValue = filterValue.toLowerCase()
      const title = row.original.planVersion.title.toLowerCase()
      const version = row.original.planVersion.version.toString().toLowerCase()
      const description = row.original.planVersion.description?.toLowerCase() ?? ""

      if (
        title.includes(searchValue) ||
        version.includes(searchValue) ||
        description.includes(searchValue)
      ) {
        return true
      }

      return false
    },
  },
  {
    accessorKey: "currency",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Currency" />,
    cell: ({ row }) => (
      <Badge className="text-xs" variant="secondary">
        {row.original.planVersion.currency}
      </Badge>
    ),
    filterFn: (row, _, value) => {
      return Array.isArray(value) && value.includes(row.original.planVersion.currency)
    },
  },
  {
    accessorKey: "planType",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.planVersion.planType}</Badge>,
  },
  {
    accessorKey: "status",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <div className="">
        <Badge
          className={cn("danger", {
            success: row.original.status === "active",
          })}
        >
          {row.original.status}
        </Badge>
      </div>
    ),
    filterFn: (row, _, value) => {
      return Array.isArray(value) && value.includes(row.original.status)
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("startDate"))}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
    cell: ({ row }) => (
      <div>{(row.original.endDate && formatDate(row.original.endDate)) ?? "Forever"}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      return <DataTableRowActions row={row} />
    },
    size: 30,
  },
]
