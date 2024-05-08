import { Suspense } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PlusIcon } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
import type { PlanVersionFeatureDragDrop } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Separator } from "@builderai/ui/separator"

import { api } from "~/trpc/server"
import { FeatureDialog } from "../../_components/feature-dialog"
import { ResizablePanelConfig } from "../../_components/resizable"
import { FeatureList } from "./feature-list"
import { PlanFeatureList } from "./plan-feature-list"

interface PlanVersionConfiguratorProps {
  planVersion: RouterOutputs["planVersions"]["getById"]["planVersion"]
}

export function PlanVersionConfigurator({
  planVersion,
}: PlanVersionConfiguratorProps) {
  const layout = cookies().get("react-resizable-panels:layout")

  if (!planVersion) {
    notFound()
  }

  const orderPlanVersionFeaturesId =
    planVersion.metadata?.orderPlanVersionFeaturesId ?? []
  const initialFeatures = planVersion.planFeatures ?? []

  // given orderPlanVersionFeaturesId, we need to sort the initialFeatures
  // so that the features are displayed in the correct order
  const orderedFeatures: PlanVersionFeatureDragDrop[] = []

  orderPlanVersionFeaturesId.forEach((id) => {
    const feature = initialFeatures.find((obj) => obj.id === id)
    if (feature) {
      orderedFeatures.push({
        ...feature,
        feature: feature.feature,
        planVersion: {
          id: planVersion.id,
        },
      })
    }
  })

  const defaultLayout = layout?.value
    ? (JSON.parse(layout.value) as [number, number])
    : [30, 70]

  return (
    <ResizablePanelConfig
      defaultLayout={defaultLayout}
      featureList={
        <>
          <div
            className={cn(
              "flex h-[70px] items-center justify-between space-x-1 px-4"
            )}
          >
            <h1 className="truncate text-xl font-bold">All features</h1>
            <FeatureDialog>
              <Button variant="default" size="sm">
                <PlusIcon className="h-3.5 w-3.5" />
              </Button>
            </FeatureDialog>
          </div>

          <Separator />

          <Suspense fallback={null}>
            <FeatureList featuresPromise={api.features.listByActiveProject()} />
          </Suspense>
        </>
      }
      planFeatureList={
        <Suspense fallback={null}>
          <PlanFeatureList initialFeatures={orderedFeatures} />
        </Suspense>
      }
    />
  )
}
