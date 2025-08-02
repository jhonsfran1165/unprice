"use client"

import {
  DEFAULT_INTERVAL,
  DEFAULT_INTERVALS,
  INTERVAL_KEYS,
  type Interval,
} from "@unprice/analytics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { useFilter } from "~/hooks/use-filter"

export function Filter() {
  const [{ interval }, setFilters] = useFilter()

  return (
    <Select
      onValueChange={(value) => {
        setFilters({ interval: value as Interval })
      }}
      value={interval ?? DEFAULT_INTERVAL}
    >
      <SelectTrigger className="w-24 items-start [&_[data-description]]:hidden">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {INTERVAL_KEYS.map((i) => (
          <SelectItem value={i} key={i}>
            <div className="flex items-start gap-3">
              <div className="grid gap-0.5">
                <p>{i}</p>
                <p className="text-xs" data-description>
                  {DEFAULT_INTERVALS[i]}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
