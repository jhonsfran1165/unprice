"use client"
import { prepareInterval } from "@unprice/analytics"
import { useQueryStates } from "nuqs"
import { useMemo } from "react"
import { intervalParser, pageParser } from "~/lib/searchParams"

export function useIntervalFilter() {
  const [intervalFilter, setIntervalFilter] = useQueryStates(intervalParser, {
    history: "replace", // push or replace -> push will add a new entry to the history, replace will replace the current entry
    shallow: true,
    scroll: false, // scroll to the top of the page when the filter changes
    clearOnDefault: true,
    throttleMs: 1000, // throttle the query state changes to 1 second
  })

  const parsedInterval = useMemo(() => {
    return prepareInterval(intervalFilter.intervalFilter)
  }, [intervalFilter])

  return [parsedInterval, setIntervalFilter] as const
}

export function usePageFilter() {
  const [pageFilter, setPageFilter] = useQueryStates(pageParser, {
    history: "replace",
    shallow: false, // trigger a full page reload when the filter changes
    scroll: false,
    clearOnDefault: true,
    throttleMs: 1000, // throttle the query state changes to 1 second
  })

  return [pageFilter, setPageFilter] as const
}
