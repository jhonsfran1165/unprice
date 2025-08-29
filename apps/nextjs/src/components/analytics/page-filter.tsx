"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import type { Page } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@unprice/ui/select"
import { Skeleton } from "@unprice/ui/skeleton"
import { cn } from "@unprice/ui/utils"
import { Sticker } from "lucide-react"
import { useParams } from "next/navigation"
import { use } from "react"
import { SuperLink } from "~/components/super-link"
import { usePageFilter } from "~/hooks/use-filter"
import { useTRPC } from "~/trpc/client"

export function PageFilter({
  className,
  pagesPromise,
}: { className?: string; pagesPromise: Promise<{ pages: Page[] }> }) {
  const trpc = useTRPC()
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const basePath = `/${workspaceSlug}/${projectSlug}`
  const initialData = use(pagesPromise)

  const { data: pages, isLoading } = useSuspenseQuery(
    trpc.pages.listByActiveProject.queryOptions(
      {},
      {
        initialData: initialData,
      }
    )
  )
  const [pageFilter, setPageFilter] = usePageFilter()

  return (
    <Select
      onValueChange={(value) => {
        setPageFilter({ pageId: value as string })
      }}
      value={pageFilter.pageId}
    >
      <SelectTrigger className={cn("w-44 items-start [&_[data-description]]:hidden", className)}>
        <div className="flex items-center gap-2 font-medium text-xs">
          <Sticker className="size-4" />
          {pages?.pages.length === 0 ? (
            <SelectValue placeholder="No pages found" />
          ) : (
            <SelectValue placeholder="Select page" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="w-44">
        {isLoading && <Skeleton className="h-9 w-full" />}
        <SelectItem value="all" key="all">
          <div className="flex items-start gap-3">
            <div className="grid gap-0.5">
              <p className="line-clamp-1 font-medium text-xs">All pages</p>
              <p className="line-clamp-1 text-muted-foreground text-xs" data-description>
                All pages are selected
              </p>
            </div>
          </div>
        </SelectItem>
        {pages?.pages.map((page) => (
          <SelectItem value={page.id} key={page.id}>
            <div className="flex items-start gap-3">
              <div className="grid gap-0.5">
                <p className="line-clamp-1 font-medium text-xs">{page.name}</p>
                <p className="line-clamp-1 text-muted-foreground text-xs" data-description>
                  {page.description}
                </p>
              </div>
            </div>
          </SelectItem>
        ))}
        {pages && pages.pages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-2">
            <p className="w-full text-center font-medium text-muted-foreground text-sm">
              No pages found
            </p>
            <SuperLink href={`${basePath}/pages`} className="mt-2 w-full">
              <Button className="w-full" size={"sm"}>
                Create a page
              </Button>
            </SuperLink>
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
