"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"

import type { RouterOutputs } from "@builderai/api"
import { Button } from "@builderai/ui/button"
import { Checkbox } from "@builderai/ui/checkbox"
import { Copy, CopyDone, Eye, EyeOff } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"
import { DataTableRowActions } from "./data-table-row-actions"

export type ApiKey = RouterOutputs["apikeys"]["listApiKeys"]["apikeys"][number]

export const columns: ColumnDef<ApiKey>[] = [
  {
    id: "select",
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
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "key",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Key" />,
    cell: ({ row }) => {
      const [show, setShow] = useState(false)
      const [copied, setCopied] = useState(false)

      const key = row.original.key

      const displayText = show ? key : "sk_live_****************"

      return (
        <div className="flex items-center justify-between">
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
                }, 1500)
              }}
            >
              <span className="sr-only">Toggle key visibility</span>
              {show ? <EyeOff /> : <Eye />}
            </Button>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 opacity-50"
              onClick={async () => {
                setCopied(true)
                await Promise.all([
                  navigator.clipboard.writeText(key),
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                ])
                setCopied(false)
              }}
            >
              <span className="sr-only">Copy key</span>
              {copied ? <CopyDone /> : <Copy />}
            </Button>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <div>{formatDate(row.getValue("createdAt"))}</div>,
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
          <div className="text-destructive flex flex-col">
            <span>Revoked</span>
            <span>{formatDate(row.original.revokedAt)}</span>
          </div>
        )
      }

      if (expiresAt === null) {
        return "Never expires"
      }

      if (expiresAt < new Date()) {
        return (
          <div className="text-destructive flex flex-col">
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
      return formatDate(lastUsed)
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
