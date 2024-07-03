"use client"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { nFormatter } from "~/lib/nformatter"

import { Button } from "@builderai/ui/button"
import { type Bar, BarList } from "@builderai/ui/charts"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { m } from "framer-motion"

export function BarListAnalytics<T = unknown>({
  tab,
  data,
  limit,
}: {
  tab: string
  data: Bar<T>[]
  limit?: number
}) {
  const [search, setSearch] = useState("")
  const [currentLimit, setCurrentLimit] = useState(limit)
  const hasMore = currentLimit ? data.length > currentLimit : false

  const filteredData = useMemo(() => {
    if (currentLimit) {
      const limitedData = data.slice(0, currentLimit)
      return search
        ? limitedData.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
        : limitedData
    }

    return search ? data.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())) : data
  }, [data, currentLimit, search])

  const bars =
    filteredData.length === 0 ? (
      <div className="text-muted-foreground text-center py-4">No data available</div>
    ) : (
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

      {hasMore ? (
        <m.div
          className="text-center mt-4"
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          <Button size={"sm"} className="w-44 mx-auto" onClick={() => setCurrentLimit(undefined)}>
            View All
          </Button>
        </m.div>
      ) : (
        <div className="text-center mt-4">
          <div className="h-7" />
        </div>
      )}
    </>
  )
}
