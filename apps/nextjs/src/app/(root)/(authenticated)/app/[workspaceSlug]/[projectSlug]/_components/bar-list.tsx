"use client"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { nFormatter } from "~/lib/nformatter"

import { Button } from "@unprice/ui/button"
import { type Bar, BarList } from "@unprice/ui/charts"
import { Input } from "@unprice/ui/input"
import { ScrollArea } from "@unprice/ui/scroll-area"
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
      <div className="py-4 text-center text-muted-foreground">No data available</div>
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
      <div className="bg-background/95 px-2 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
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
          className="mt-4 text-center"
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          <Button size={"sm"} className="mx-auto w-44" onClick={() => setCurrentLimit(undefined)}>
            View All
          </Button>
        </m.div>
      ) : (
        <div className="mt-4 text-center">
          <div className="h-7" />
        </div>
      )}
    </>
  )
}
