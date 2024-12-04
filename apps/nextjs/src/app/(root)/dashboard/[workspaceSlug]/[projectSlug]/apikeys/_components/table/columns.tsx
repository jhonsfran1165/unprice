"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"

import type { RouterOutputs } from "@unprice/api"
import { Button } from "@unprice/ui/button"
import { Checkbox } from "@unprice/ui/checkbox"
import { Eye, EyeOff } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"

import { CopyButton } from "~/components/copy-button"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

export type ApiKey = RouterOutputs["apikeys"]["listByActiveProject"]["apikeys"][number]

export const columns: ColumnDef<ApiKey>[] = [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        disabled={
          table.getRowModel().rows.length === 0 ||
          table.getRowModel().rows.every((row) => row.original.revokedAt !== null)
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
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
    enableSorting: true,
    enableHiding: false,
    enableResizing: true,
  },
  {
    accessorKey: "key",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Key" />,
    cell: ({ row }) => {
      const [show, setShow] = useState(false)

      const key = row.original.key

      const displayText = show ? key : "sk_live_****************"

      return (
        <div className="flex items-center justify-between space-x-2">
          <span className={cn("font-mono", row.original.revokedAt !== null && "line-through")}>
            {displayText}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 opacity-50"
              disabled={show}
              onClick={() => {
                setShow(true)
                setTimeout(() => {
                  setShow(false)
                }, 2000)
              }}
            >
              <span className="sr-only">Toggle key visibility</span>
              {show ? <EyeOff /> : <Eye />}
            </Button>

            <CopyButton value={key} className="size-4 opacity-50" />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAtM",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("createdAtM"))}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires At" />,
    cell: ({ row }) => {
      const expiresAt = row.original.expiresAt

      if (row.original.revokedAt !== null) {
        return (
          <div className="flex flex-col text-destructive">
            <span>Revoked</span>
            <span>{formatDate(row.original.revokedAt)}</span>
          </div>
        )
      }

      if (expiresAt === null) {
        return "Never expires"
      }

      if (expiresAt < Date.now()) {
        return (
          <div className="flex flex-col text-destructive">
            <span>Expired</span>
            <span>{formatDate(expiresAt)}</span>
          </div>
        )
      }
      return formatDate(expiresAt)
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "lastUsed",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last used" />,
    cell: ({ row }) => {
      const lastUsed = row.original.lastUsed
      if (lastUsed === null) {
        return "Never used"
      }
      return <div>{formatDate(lastUsed)}</div>
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      return <DataTableRowActions row={row} />
    },
    size: 40,
  },
]
