"use client"

import { use, useState } from "react"
import { FileStack, Search } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import type { PlanVersionFeature } from "@builderai/db/validators"
import { Button } from "@builderai/ui/button"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"

import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useDebounce } from "~/lib/use-debounce"
import { api } from "~/trpc/client"
import { FeatureDialog } from "../../_components/feature-dialog"
import { SortableFeature } from "../../_components/sortable-feature"
import { usePlanFeaturesList } from "../../_components/use-features"

interface FeatureListProps {
  featuresPromise: Promise<RouterOutputs["features"]["searchBy"]>
}

export function FeatureList({ featuresPromise }: FeatureListProps) {
  const initialFeatures = use(featuresPromise)
  const [filter, setFilter] = useState("")
  const filterDebounce = useDebounce(filter, 500)

  const [planFeatures] = usePlanFeaturesList()

  const activeFeatures = [
    ...planFeatures.planFeatures,
    ...planFeatures.planAddons,
  ]

  const { data } = api.features.searchBy.useQuery(
    {
      search: filterDebounce,
    },
    {
      staleTime: 0,
      initialData: initialFeatures,
      refetchOnMount: false,
    }
  )

  const planFeatureIds = activeFeatures.map((feature) => feature.id)

  const searchableFeatures = data.features.filter(
    (feature) => !planFeatureIds.includes(feature.id)
  )

  return (
    <>
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feature"
            className="pl-8"
            onChange={(e) => {
              setFilter(e.target.value)
            }}
          />
        </div>
      </div>
      <ScrollArea className="h-[750px] pb-4">
        <div className="flex flex-col gap-2 px-4 pt-0">
          {searchableFeatures.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <FileStack className="h-8 w-8" />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No features found</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Create feature
              </EmptyPlaceholder.Description>
              <EmptyPlaceholder.Action>
                <FeatureDialog
                  defaultValues={{
                    title: filterDebounce,
                    slug: filterDebounce,
                    description: "",
                  }}
                >
                  <Button>Create feature</Button>
                </FeatureDialog>
              </EmptyPlaceholder.Action>
            </EmptyPlaceholder>
          ) : (
            searchableFeatures.map((feature, index) => (
              <SortableFeature
                key={index}
                mode={"Feature"}
                feature={
                  {
                    id: feature.id,
                    title: feature.title,
                    description: feature.description,
                    slug: feature.slug,
                  } as PlanVersionFeature
                }
                variant={"feature"}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  )
}
