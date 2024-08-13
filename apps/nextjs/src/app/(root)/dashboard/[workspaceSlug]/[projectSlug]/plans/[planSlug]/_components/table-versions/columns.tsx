"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@unprice/api"
import { Checkbox } from "@unprice/ui/checkbox"
import { cn } from "@unprice/ui/utils"

import { Badge } from "@unprice/ui/badge"
import { Typography } from "@unprice/ui/typography"
import { usePathname } from "next/navigation"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { SuperLink } from "~/components/super-link"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

export type PlanVersion = RouterOutputs["plans"]["getVersionsBySlug"]["plan"]["versions"][number]

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
          table.getRowModel().rows.every((row) => !row.original.active)
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
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => {
      const pathname = usePathname()

      return (
        <SuperLink href={`${pathname}/${row.original.id}`} prefetch={false}>
          <div className="flex items-center space-x-2">
            <Typography variant="h6" className="truncate">
              {row.original.title}
            </Typography>

            {row.original.latest && (
              <div className={"inline-flex items-center font-medium text-info text-xs"}>
                <span className={"flex h-2 w-2 rounded-full bg-info"} />
                <span className="ml-1">latest</span>
              </div>
            )}
          </div>

          {row.original.description && (
            <div className="line-clamp-1 hidden text-muted-foreground text-xs md:inline">
              {`${row.original.description.slice(0, 40)}...`}
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
      const title = row.original.title.toLowerCase()
      const version = row.original.version.toString().toLowerCase()
      const description = row.original.description?.toLowerCase() ?? ""

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
    accessorKey: "subs",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="subs" />,
    cell: ({ row }) => <Badge>{row.original.subscriptions}</Badge>,
    size: 20,
  },
  {
    accessorKey: "period",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="period" />,
    cell: ({ row }) => <Badge>{row.original.billingPeriod}</Badge>,
    size: 20,
  },
  {
    accessorKey: "version",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
    cell: ({ row }) => (
      <Badge className="text-xs" variant="secondary">
        V{row.original.version}
      </Badge>
    ),
    size: 20,
  },
  {
    accessorKey: "active",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) => (
      <Badge
        className={cn({
          info: row.original.active,
          danger: !row.original.active,
        })}
      >
        {row.original.active ? "active" : "inactive"}
      </Badge>
    ),
    size: 20,
  },
  {
    accessorKey: "status",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge
        className={cn({
          success: row.original.status === "published",
        })}
      >
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id))
    },
    size: 40,
  },
  {
    accessorKey: "currency",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Currency" />,
    cell: ({ row }) => (
      <Badge className="text-xs" variant="secondary">
        {row.original.currency}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id))
    },
    size: 40,
  },
  {
    accessorKey: "planType",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.planType}</Badge>,
    size: 40,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("createdAt"))}</div>,
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Updated At" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("updatedAt"))}</div>,
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
