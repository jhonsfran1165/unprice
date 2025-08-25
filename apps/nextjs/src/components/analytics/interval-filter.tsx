"use client"

import { INTERVAL_KEYS, type Interval, prepareInterval } from "@unprice/analytics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { cn } from "@unprice/ui/utils"
import { Calendar } from "lucide-react"
import { useHotkeys } from "react-hotkeys-hook"
import { useIntervalFilter } from "~/hooks/use-filter"
import { capitalize } from "~/lib/capitalize"

export function IntervalFilter({ className }: { className?: string }) {
  const [intervalFilter, setIntervalFilter] = useIntervalFilter()

  const hotkeys = INTERVAL_KEYS.map((i) => prepareInterval(i).hotkey)

  useHotkeys(hotkeys, (_, handler) => {
    const key = handler.keys?.at(0)
    if (!key) return

    const interval = INTERVAL_KEYS.find(
      (i) => prepareInterval(i).hotkey.toLocaleUpperCase() === key.toLocaleUpperCase()
    )

    if (interval) {
      setIntervalFilter({ intervalFilter: interval })
    }
  })

  return (
    <Select
      onValueChange={(value) => {
        setIntervalFilter({ intervalFilter: value as Interval })
      }}
      value={intervalFilter.name}
    >
      <SelectTrigger className={cn("w-44 items-start [&_[data-description]]:hidden", className)}>
        <div className="flex items-center gap-2 font-medium text-xs">
          <Calendar className="size-4" />
          <SelectValue placeholder="Select date range" />
        </div>
      </SelectTrigger>
      <SelectContent className="w-44">
        {INTERVAL_KEYS.map((i) => {
          const parsedInterval = prepareInterval(i)
          return (
            <SelectItem
              value={i}
              key={i}
              className="font-medium text-xs"
              shortcut={parsedInterval.hotkey}
              description={`Look back at the ${parsedInterval.label} data`}
            >
              {capitalize(parsedInterval.label)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
