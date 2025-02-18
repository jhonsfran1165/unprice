"use client"

import { FileStack, Search } from "lucide-react"
import { Fragment, use, useState } from "react"

import type { RouterOutputs } from "@unprice/api"
import type { PlanVersionFeatureDragDrop } from "@unprice/db/validators"
import { Button } from "@unprice/ui/button"
import { Input } from "@unprice/ui/input"
import { ScrollArea } from "@unprice/ui/scroll-area"

import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { useDebounce } from "~/hooks/use-debounce"
import { usePlanFeaturesList } from "~/hooks/use-features"
import { api } from "~/trpc/client"
import { FeatureDialog } from "../../_components/feature-dialog"
import { SortableFeature } from "../../_components/sortable-feature"

interface FeatureListProps {
  featuresPromise: Promise<RouterOutputs["features"]["searchBy"]>
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}

export function FeatureList({ featuresPromise, planVersion }: FeatureListProps) {
  const initialFeatures = use(featuresPromise)
  const [filter, setFilter] = useState("")
  const filterDebounce = useDebounce(filter, 500)

  const [planVersionFeatureList] = usePlanFeaturesList()

  const { data, isFetching } = api.features.searchBy.useQuery(
    {
      search: filterDebounce,
    },
    {
      staleTime: 0,
      initialData: initialFeatures,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  )

  if (!planVersion) return null

  const planFeatureIds = planVersionFeatureList.map((feature) => feature.feature.id)

  const searchableFeatures = data.features.filter((feature) => !planFeatureIds.includes(feature.id))

  return (
    <Fragment>
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search feature"
            className="pl-8"
            onChange={(e) => {
              setFilter(e.target.value)
            }}
          />
        </div>
      </div>
      <ScrollArea className="h-[750px] pb-4">
        <div className="flex h-[730px] flex-col gap-2 px-4 pt-1">
          {isFetching && (
            <div className="flex h-full items-center justify-center">
              <LoadingAnimation className="size-6" />
            </div>
          )}
          {!isFetching && searchableFeatures.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <FileStack className="h-8 w-8" />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>No features found</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>Create feature</EmptyPlaceholder.Description>
              <EmptyPlaceholder.Action>
                <FeatureDialog
                  defaultValues={{
                    title: filterDebounce,
                    slug: filterDebounce,
                    description: "",
                  }}
                >
                  <Button size={"sm"}>Create feature</Button>
                </FeatureDialog>
              </EmptyPlaceholder.Action>
            </EmptyPlaceholder>
          ) : (
            !isFetching &&
            searchableFeatures.map((feature) => {
              // define planFeatureVersion defaults
              // this will be used to create a new featurePlan optimistically from the drag and drop
              const planFeatureVersion = {
                planVersionId: planVersion.id,
                featureId: feature.id,
                featureType: "flat", // default type for featurePlan
                feature: feature,
                order: 1024, // first element
                // default config price
                config: {
                  price: {
                    displayAmount: "0.00",
                    dinero: {
                      amount: 0,
                      currency: {
                        code: planVersion.currency,
                        base: 10,
                        exponent: 2,
                      },
                      scale: 2,
                    },
                  },
                },
              } as PlanVersionFeatureDragDrop

              return (
                <SortableFeature
                  key={Math.random()}
                  mode={"Feature"}
                  planFeatureVersion={planFeatureVersion}
                  variant={"feature"}
                />
              )
            })
          )}
        </div>
      </ScrollArea>
    </Fragment>
  )
}
