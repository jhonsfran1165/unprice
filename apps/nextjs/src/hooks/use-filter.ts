"use client"

import { DEFAULT_INTERVAL, INTERVAL_KEYS } from "@unprice/tinybird"
import { parseAsStringEnum, useQueryStates } from "nuqs"

const intervalParser = parseAsStringEnum(INTERVAL_KEYS).withDefault(DEFAULT_INTERVAL)

export function useFilter() {
  return useQueryStates(
    {
      interval: intervalParser,
    },
    {
      history: "push",
      shallow: false, // otherwise it will not trigger a re-render on the server
      scroll: false,
      clearOnDefault: true,
    }
  )
}
