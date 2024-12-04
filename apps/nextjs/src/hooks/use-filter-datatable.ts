"use client"

import { useQueryStates } from "nuqs"
import { filtersDataTableParsers } from "~/lib/searchParams"

export function useFilterDataTable() {
  return useQueryStates(filtersDataTableParsers, {
    history: "push",
    shallow: false, // otherwise it will not trigger a re-render on the server
    scroll: false,
    clearOnDefault: true,
  })
}
