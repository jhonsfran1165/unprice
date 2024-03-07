"use client"

import { useState } from "react"

import { cn } from "@builderai/ui"
import { Search } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { useDebounce } from "~/lib/use-debounce"
import { api } from "~/trpc/client"
import { FeatureForm } from "./feature-form"
import { SortableFeature } from "./sortable-feature"

interface FeaturesProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedFeaturesIds: string[]
  projectSlug: string
}

export function Features({
  className,
  selectedFeaturesIds,
  projectSlug,
}: FeaturesProps) {
  const [search, setSearch] = useState("")

  const debouncedSearch = useDebounce(search, 500)

  const { data, isLoading } = api.features.searchBy.useQuery({
    projectSlug: projectSlug,
    search: debouncedSearch,
  })

  const dbFeatures = data?.features ?? []

  const searchableFeatures = dbFeatures.filter((feature) => {
    return !selectedFeaturesIds.includes(feature.id)
  })

  // TODO: handle empty state and loading state
  return (
    <div className={cn("flex flex-1 flex-col overflow-y-auto", className)}>
      <div className="flex items-center px-4 py-2">
        <h1 className="text-xl font-bold">Features</h1>
      </div>
      <Separator />
      <div className="flex flex-row items-center space-x-1 p-2 backdrop-blur">
        <form className="w-full">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="h-8 pl-8"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
            />
          </div>
        </form>
        <FeatureForm projectSlug={projectSlug} mode={"create"} />
      </div>
      <ScrollArea className="max-h-[750px] flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : searchableFeatures?.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No features found.
              </div>
            ) : (
              searchableFeatures?.map((feature) => (
                <SortableFeature
                  key={feature.id}
                  feature={feature}
                  projectSlug={projectSlug}
                  type="Feature"
                />
              ))
            )}
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}
