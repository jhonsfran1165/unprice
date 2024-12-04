"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { formatRelative } from "date-fns"

import type { RouterOutputs } from "@unprice/api"
import { Avatar, AvatarFallback, AvatarImage } from "@unprice/ui/avatar"
import { Checkbox } from "@unprice/ui/checkbox"

import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type Member = RouterOutputs["workspaces"]["listMembersByActiveWorkspace"]["members"][number]

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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={row.original.user.image ?? ""} alt={row.original.user.name ?? ""} />
          <AvatarFallback>{row.original.user.name?.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span>{row.original.user.name}</span>
          <span className="text-muted-foreground text-sm">{row.original.user.email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "createdAtM",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined at" />,
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
