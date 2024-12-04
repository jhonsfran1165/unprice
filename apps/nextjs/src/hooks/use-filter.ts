"use client"
import { useQueryStates } from "nuqs"
import { intervalParser } from "~/lib/searchParams"

export function useFilter() {
  return useQueryStates(intervalParser, {
    history: "push",
    shallow: false, // otherwise it will not trigger a re-render on the server
    scroll: false,
    clearOnDefault: true,
  })
}
