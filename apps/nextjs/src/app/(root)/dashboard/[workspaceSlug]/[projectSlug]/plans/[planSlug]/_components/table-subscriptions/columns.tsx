"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@unprice/api"
import { Checkbox } from "@unprice/ui/checkbox"
import { cn } from "@unprice/ui/utils"

import { Badge } from "@unprice/ui/badge"
import { Typography } from "@unprice/ui/typography"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

type PlanVersion = RouterOutputs["plans"]["getSubscriptionsBySlug"]["subscriptions"][number]

export const columns: ColumnDef<PlanVersion>[] = [
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
    accessorKey: "planVersion",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan Version" />,
    cell: ({ row }) => {
      return (
        <div>
          <div className="flex items-center space-x-2">
            <Typography variant="h6" className="truncate">
              {row.original.version.title}
            </Typography>

            {row.original.isNew && (
              <div className={"inline-flex items-center font-medium text-success text-xs"}>
                <span className={"flex h-2 w-2 rounded-full bg-success"} />
                <span className="ml-1">new</span>
              </div>
            )}

            {row.original.trialDays !== null && row.original.trialDays > 0 && (
              <div className="hidden items-center font-medium text-info text-xs lg:inline-flex">
                <span className="flex h-2 w-2 rounded-full bg-info" />
                <span className="ml-1">{row.original.trialDays} trial days left</span>
              </div>
            )}
          </div>

          {row.original.version.description && (
            <div className="line-clamp-1 hidden text-muted-foreground text-xs md:inline">
              {`${row.original.version.description.slice(0, 40)}...`}
            </div>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
    filterFn: (row, _, filterValue) => {
      // search by title and description
      const searchValue = filterValue.toLowerCase()
      const title = row.original.version.title.toLowerCase()
      const version = row.original.version.toString().toLowerCase()
      const description = row.original.version.description?.toLowerCase() ?? ""

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
    accessorKey: "version",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <Badge className="text-xs" variant="secondary">
        V{row.original.version.version}
      </Badge>
    ),
    size: 20,
    filterFn: (row, _, value) => {
      // filter by version and id
      const version = row.original.version.version
      const id = row.original.version.id

      return Array.isArray(value) && (value.includes(version) || value.includes(id))
    },
  },
  {
    accessorKey: "customer",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => row.original.customer.email,
    size: 40,
  },
  {
    accessorKey: "status",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge
        className={cn({
          success: row.original.status === "active",
        })}
      >
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id))
    },
    size: 20,
  },
  {
    accessorKey: "type",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.type}</Badge>,
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id))
    },
    size: 20,
  },
  {
    accessorKey: "collectionMethod",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Collection Method" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.collectionMethod}</Badge>,
    size: 40,
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("startDate"))}</div>,
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
    cell: ({ row }) => {
      const endDate = row.getValue("endDate")

      if (endDate === null) {
        return <div>Forever</div>
      }

      return <div>{formatDate(row.getValue("endDate"))}</div>
    },
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      return <DataTableRowActions row={row} />
    },
    size: 30,
  },
]
