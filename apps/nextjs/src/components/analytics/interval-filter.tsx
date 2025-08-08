"use client"

import { DEFAULT_INTERVALS, INTERVAL_KEYS, type Interval } from "@unprice/analytics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { cn } from "@unprice/ui/utils"
import { Calendar } from "lucide-react"
import { useIntervalFilter } from "~/hooks/use-filter"

export function IntervalFilter({ className }: { className?: string }) {
  const [intervalFilter, setIntervalFilter] = useIntervalFilter({
    shallow: true,
  })

  return (
    <Select
      onValueChange={(value) => {
        setIntervalFilter({ intervalFilter: value as Interval })
      }}
      value={intervalFilter.name}
    >
      <SelectTrigger className={cn("w-40 items-start [&_[data-description]]:hidden", className)}>
        <div className="flex items-center gap-2 font-medium text-xs">
          <Calendar className="size-4" />
          <SelectValue placeholder="Select date range" />
        </div>
      </SelectTrigger>
      <SelectContent className="w-40">
        {INTERVAL_KEYS.map((i) => (
          <SelectItem value={i} key={i}>
            <div className="flex items-start gap-3">
              <div className="grid gap-0.5">
                <p className="font-medium text-xs">{DEFAULT_INTERVALS[i]}</p>
                <p className="line-clamp-1 text-muted-foreground text-xs" data-description>
                  Look back at the last {i}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
