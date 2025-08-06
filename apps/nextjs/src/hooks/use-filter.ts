"use client"
import { prepareInterval } from "@unprice/analytics"
import { useQueryStates } from "nuqs"
import { useMemo } from "react"
import { intervalParser, pageParser } from "~/lib/searchParams"

export function useIntervalFilter({
  shallow = true,
  history = "replace",
  scroll = false,
}: {
  shallow?: boolean
  history?: "push" | "replace"
  scroll?: boolean
} = {}) {
  const [intervalFilter, setIntervalFilter] = useQueryStates(intervalParser, {
    history, // push or replace -> push will add a new entry to the history, replace will replace the current entry
    shallow, // otherwise it will not trigger a re-render on the server
    scroll, // scroll to the top of the page when the filter changes
    clearOnDefault: true,
  })

  const parsedInterval = useMemo(() => {
    return prepareInterval(intervalFilter.intervalFilter)
  }, [intervalFilter])

  return [parsedInterval, setIntervalFilter] as const
}

export function usePageFilter({
  shallow = true,
  history = "replace",
  scroll = false,
}: {
  shallow?: boolean
  history?: "push" | "replace"
  scroll?: boolean
} = {}) {
  const [pageFilter, setPageFilter] = useQueryStates(pageParser, {
    history,
    shallow,
    scroll,
    clearOnDefault: true,
  })

  return [pageFilter, setPageFilter] as const
}
