"use client"

import { useQuery } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Skeleton } from "@unprice/ui/skeleton"
import { cn } from "@unprice/ui/utils"
import { Sticker } from "lucide-react"
import { usePageFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

export function PageFilter({ className }: { className?: string }) {
  const trpc = useTRPC()
  const { data: pages, isLoading } = useQuery(trpc.pages.listByActiveProject.queryOptions({}))
  const [pageFilter, setPageFilter] = usePageFilter({
    shallow: true,
  })

  return (
    <Select
      onValueChange={(value) => {
        setPageFilter({ pageId: value as string })
      }}
      value={pageFilter.pageId}
    >
      <SelectTrigger className={cn("w-40 items-start [&_[data-description]]:hidden", className)}>
        <div className="flex items-center gap-2">
          <Sticker className="size-4" />
          <SelectValue className="font-medium" placeholder="Select page" />
        </div>
      </SelectTrigger>
      <SelectContent className="w-40">
        {isLoading && (
          <SelectItem value="none" key="none">
            <Skeleton className="h-9 w-full" />
          </SelectItem>
        )}
        {pages?.pages.map((page) => (
          <SelectItem value={page.id} key={page.id}>
            <div className="flex items-start gap-3">
              <div className="grid gap-0.5">
                <p className="font-medium">{page.name}</p>
                <p className="text-muted-foreground text-xs" data-description>
                  {page.description}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
        {pages && pages.pages.length === 0 && (
          <SelectItem value="none" key="none">
            <div className="flex items-start gap-3">
              <p className="font-medium">No pages found</p>
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
