"use client"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { nFormatter } from "~/lib/nformatter"

import { type Bar, BarList } from "@builderai/ui/charts"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"

export default function BarListAnalytics<T = unknown>({
  tab,
  data,
  limit,
}: {
  tab: string
  data: Bar<T>[]
  limit?: number
}) {
  const [search, setSearch] = useState("")

  // TODO: mock pagination for better perf in React
  const filteredData = useMemo(() => {
    if (!limit) {
      return data.slice(0, limit)
    }
    return search ? data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())) : data
  }, [data, limit, search])

  const bars = (
    <BarList
      key={tab}
      data={filteredData}
      onValueChange={(value) => console.info(value)}
      valueFormatter={(value) => nFormatter(value)}
      showAnimation
    />
  )

  if (!limit) {
    return bars
  }

  return (
    <>
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 py-4 px-2 backdrop-blur">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            type="search"
            className="pl-8"
            placeholder={`Search ${tab}...`}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="h-48 px-4">
        <div className="h-48 py-2">{bars}</div>
      </ScrollArea>
    </>
  )
}
