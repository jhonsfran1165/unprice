import type { PlanVersionFeature } from "@builderai/db/validators"
import { ScrollArea } from "@builderai/ui/scroll-area"

import { useSelectedFeatures } from "../use-mail"
import { SortableFeature } from "./sortable-feature"

interface FeatureListProps {
  features: PlanVersionFeature[]
}

export function FeatureList({ features }: FeatureListProps) {
  const [planFeatures] = useSelectedFeatures()

  const planFeatureIds = planFeatures.map((feature) => feature.id)

  const searchableFeatures = features.filter(
    (feature) => !planFeatureIds.includes(feature.id)
  )

  return (
    <ScrollArea className="h-[750px] pb-4">
      <div className="flex flex-col gap-2 px-4 pt-0">
        {searchableFeatures.map((feature, index) => (
          <SortableFeature
            key={index}
            mode={"Feature"}
            feature={feature}
            variant={"feature"}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
