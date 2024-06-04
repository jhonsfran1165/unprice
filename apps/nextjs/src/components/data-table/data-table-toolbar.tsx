"use client"

import type { Table } from "@tanstack/react-table"

import { Button } from "@builderai/ui/button"
import { XCircle } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"

import type { FilterOptionDataTable } from "./data-table"
import { DataTableDateRangePicker } from "./data-table-date-ranger-picker"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-options"

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
  },
  {
    value: "todo",
    label: "Todo",
  },
  {
    value: "in progress",
    label: "In Progress",
  },
  {
    value: "done",
    label: "Done",
  },
  {
    value: "canceled",
    label: "Canceled",
  },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterOptions?: FilterOptionDataTable
}

export function DataTableToolbar<TData>({ table, filterOptions }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const filterBy = filterOptions?.filterBy ?? ""
  const status = table.getAllColumns().find((column) => column.id === "status")

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn(filterBy) && (
          <Input
            placeholder={`filter by ${filterBy}...`}
            value={(table.getColumn(filterBy)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(filterBy)?.setFilterValue(event.target.value)}
            className="bg-background h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {status && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            size={"sm"}
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <XCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {filterOptions?.filterDateRange && <DataTableDateRangePicker />}
        {filterOptions?.filterColumns && <DataTableViewOptions table={table} />}
      </div>
    </div>
  )
}
