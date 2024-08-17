"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { Customer } from "@unprice/db/validators"
import { Checkbox } from "@unprice/ui/checkbox"

import { Badge } from "@unprice/ui/badge"
import { cn } from "@unprice/ui/utils"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { SuperLink } from "~/components/super-link"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <SuperLink href={`./customers/${row.original.id}`} scroll={false}>
        <div className="whitespace-nowrap text-sm">{row.original.name}</div>
      </SuperLink>
    ),
    enableResizing: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <SuperLink href={`./customers/${row.original.id}`} scroll={false}>
        <div className="whitespace-nowrap text-sm">{row.original.email}</div>
      </SuperLink>
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "defaultCurrency",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Currency" />,
    cell: ({ row }) => <Badge className="text-sm">{row.original.defaultCurrency}</Badge>,
    filterFn: (row, id, value) => {
      return Array.isArray(value) && value.includes(row.getValue(id))
    },
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
    accessorKey: "timezone",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
    cell: ({ row }) => <Badge>{row.original.timezone}</Badge>,
    size: 20,
  },
  {
    accessorKey: "createdAtM",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creation Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">
        {formatDate(row.getValue("createdAtM"), row.original.timezone)}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    size: 40,
  },
]
