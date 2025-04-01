"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { formatRelative } from "date-fns"

import type { RouterOutputs } from "@unprice/trpc"
import { Checkbox } from "@unprice/ui/checkbox"

import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type Member = RouterOutputs["workspaces"]["listInvitesByActiveWorkspace"]["invites"][number]

export const columns: ColumnDef<Member>[] = [
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
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.original.email}</div>,
  },
  {
    accessorKey: "createdAtM",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created at" />,
    cell: ({ row }) => <div>{formatRelative(row.getValue("createdAtM"), new Date())}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <div>{row.getValue("role")}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
