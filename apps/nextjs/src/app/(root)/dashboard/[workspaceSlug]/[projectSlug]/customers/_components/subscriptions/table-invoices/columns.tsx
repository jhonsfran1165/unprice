"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@unprice/trpc/routes"
import { Badge } from "@unprice/ui/badge"
import { Checkbox } from "@unprice/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { Typography } from "@unprice/ui/typography"
import { format } from "date-fns"
import { InfoIcon } from "lucide-react"
import Link from "next/link"
import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header"
import { formatDate } from "~/lib/dates"

type InvoiceCustomer =
  RouterOutputs["customers"]["getSubscriptions"]["customer"]["invoices"][number]

export const columns: ColumnDef<InvoiceCustomer>[] = [
  {
    id: "select",
    size: 50,
    accessorKey: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        disabled={table.getRowModel().rows.length === 0}
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
    accessorKey: "id",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
    cell: ({ row }) => {
      return (
        <div className="whitespace-nowrap text-sm">
          <Link
            href={row.original.invoicePaymentProviderUrl ?? ""}
            target="_blank"
            className="hover:underline"
          >
            {row.original.id}
          </Link>
        </div>
      )
    },
    size: 40,
  },
  {
    accessorKey: "status",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return (
        <Badge variant={["void", "paid"].includes(row.original.status) ? "success" : "destructive"}>
          {row.original.status}
        </Badge>
      )
    },
    size: 20,
    filterFn: (row, _id, value) => {
      const status = ["void", "paid"].includes(row.original.status) ? "paid" : "unpaid"

      return Array.isArray(value) && value.includes(status)
    },
  },
  {
    accessorKey: "type",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.type}</Badge>,
    size: 20,
  },
  {
    accessorKey: "prorated",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Prorated" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.prorated ? "Yes" : "No"}</Badge>,
    size: 20,
  },
  {
    accessorKey: "provider",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
    cell: ({ row }) => <Badge className="text-xs">{row.original.paymentProvider}</Badge>,
    size: 20,
  },
  {
    accessorKey: "total",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <Badge>
        {row.original.total} {row.original.currency}
      </Badge>
    ),
    size: 20,
  },
  {
    accessorKey: "createdAtM",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created at" />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-1 whitespace-nowrap">
        <Typography variant="p" affects="removePaddingMargin">
          {formatDate(row.original.createdAtM)}
        </Typography>
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
  {
    accessorKey: "dueAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due date" />,
    cell: ({ row }) => {
      const dueAt = row.original.dueAt
      const metadata = row.original.metadata
      return (
        <div className="flex items-center space-x-1 whitespace-nowrap">
          <Typography variant="p" affects="removePaddingMargin">
            {format(new Date(dueAt), "PPpp")}
          </Typography>
          {metadata && Object.keys(metadata).length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="size-4 font-light text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="w-52" align="end" sideOffset={-20} alignOffset={10}>
                <div className="flex flex-col gap-1">
                  <pre className="whitespace-pre-wrap rounded-md bg-background p-2 font-mono text-muted-foreground text-xs">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
]
