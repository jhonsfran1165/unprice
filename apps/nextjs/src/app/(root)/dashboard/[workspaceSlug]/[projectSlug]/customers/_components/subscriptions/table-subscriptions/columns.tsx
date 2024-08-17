"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { RouterOutputs } from "@unprice/api"
import { Badge } from "@unprice/ui/badge"
import { Checkbox } from "@unprice/ui/checkbox"
import { Separator } from "@unprice/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@unprice/ui/tooltip"
import { Typography } from "@unprice/ui/typography"
import { cn } from "@unprice/ui/utils"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { AlertCircle } from "lucide-react"
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
    size: 200,
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
                <span className="ml-1">{row.original.trialDays} trial days</span>
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
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{row.original.customer.email}</div>
    ),
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
          danger: row.original.status === "ended",
          warning: row.original.status === "inactive",
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
    accessorKey: "timezone",
    enableResizing: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
    cell: ({ row }) => <Badge>{row.original.timezone}</Badge>,
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
    cell: ({ row }) => (
      <div className="flex items-center space-x-1">
        <div className="whitespace-nowrap text-sm">
          {formatDate(row.original.startDateAt, row.original.timezone)}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="size-4 font-light" />
          </TooltipTrigger>
          <TooltipContent align="start" side="right" sideOffset={10} alignOffset={-5}>
            <div className="flex flex-col gap-1">
              <Typography variant="p" affects="removePaddingMargin" className="font-semibold">
                Timezone: {row.original.timezone}
              </Typography>
              <Separator className="my-1" />
              <Typography variant="p" affects="removePaddingMargin" className="text-xs">
                <span className="font-semibold">Local time: </span>
                {format(toZonedTime(row.original.startDateAt, row.original.timezone), "PPpp")}
              </Typography>

              <Typography variant="p" affects="removePaddingMargin" className="text-xs">
                <span className="font-semibold">Customer time: </span>
                {format(new Date(row.original.startDateAt), "PPpp")}
              </Typography>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 40,
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
    cell: ({ row }) => {
      const endDate = row.original.endDateAt

      if (endDate === null || endDate === undefined) {
        return <div className="whitespace-nowrap text-sm">Forever</div>
      }

      return (
        <div className="flex items-center space-x-1">
          <div className="whitespace-nowrap text-sm">
            {formatDate(endDate, row.original.timezone)}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="size-4 font-light" />
            </TooltipTrigger>
            <TooltipContent align="start" side="right" sideOffset={10} alignOffset={-5}>
              <div className="flex flex-col gap-1">
                <Typography variant="p" affects="removePaddingMargin" className="font-semibold">
                  Timezone: {row.original.timezone}
                </Typography>
                <Separator className="my-1" />
                <Typography variant="p" affects="removePaddingMargin" className="text-xs">
                  <span className="font-semibold">Local time: </span>
                  {format(toZonedTime(endDate, row.original.timezone), "PPpp")}
                </Typography>

                <Typography variant="p" affects="removePaddingMargin" className="text-xs">
                  <span className="font-semibold">Customer time: </span>
                  {format(new Date(endDate), "PPpp")}
                </Typography>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )
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
