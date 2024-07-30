"use client"

import type { Table } from "@tanstack/react-table"

import { Button } from "@unprice/ui/button"
import { XCircle } from "@unprice/ui/icons"
import { Input } from "@unprice/ui/input"

import { useFilterDataTable } from "~/hooks/use-filter-datatable"
import { DateRangePicker } from "../analytics/date-range-picker"
import type { FilterOptionDataTable } from "./data-table"
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
  const [filters, setFilters] = useFilterDataTable()
  const isFiltered = table.getState().columnFilters.length > 0
  const filterBy = filterOptions?.filterBy ?? ""
  const status = table.getAllColumns().find((column) => column.id === "status")

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn(filterBy) && (
          <Input
            placeholder={`filter by ${filterBy}...`}
            value={(table.getColumn(filterBy)?.getFilterValue() as string) ?? filters.search ?? ""}
            onChange={(event) => {
              if (filterOptions?.filterServerSide) {
                setFilters({ search: event.target.value })
              } else {
                table.getColumn(filterBy)?.setFilterValue(event.target.value)
              }
            }}
            className="h-8 w-[150px] bg-background lg:w-[250px]"
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
        {filterOptions?.filterDateRange && (
          <DateRangePicker triggerSize="sm" triggerClassName="ml-auto w-56 sm:w-60" align="end" />
        )}
        {filterOptions?.filterColumns && <DataTableViewOptions table={table} />}
      </div>
    </div>
  )
}
