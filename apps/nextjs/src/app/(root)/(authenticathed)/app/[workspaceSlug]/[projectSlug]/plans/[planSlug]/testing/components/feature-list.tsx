import type { PlanVersionFeature } from "@builderai/db/validators"
import { ScrollArea } from "@builderai/ui/scroll-area"

import { SortableFeature } from "./sortable-feature"

interface FeatureListProps {
  features: PlanVersionFeature[]
}

export function FeatureList({ features }: FeatureListProps) {
  return (
    <ScrollArea className="h-[750px]">
      <div className="flex flex-col gap-2 px-4 pb-4 pt-0">
        {features.map((feature, index) => (
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
