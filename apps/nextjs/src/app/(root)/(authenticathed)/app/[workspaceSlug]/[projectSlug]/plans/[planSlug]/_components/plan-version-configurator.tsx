import { Suspense } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Separator } from "@builderai/ui/separator"

import { api } from "~/trpc/server"
import { FeatureDialog } from "../../_components/feature-dialog"
import { ResizablePanelConfig } from "../../_components/resizable"
import { FeatureConfig } from "./feature-config"
import { FeatureList } from "./feature-list"
import { PlanFeatureList } from "./plan-feature-list"

interface PlanVersionConfiguratorProps {
  planSlug: string
  planVersionId: string
}

export async function PlanVersionConfigurator({
  planSlug,
  planVersionId,
}: PlanVersionConfiguratorProps) {
  const layout = cookies().get("react-resizable-panels:layout")

  const { planVersion } = await api.planVersions.getByVersion({
    version: Number(planVersionId),
    planSlug,
  })

  if (!planVersion) {
    notFound()
  }

  const initialFeatures = {
    planFeatures: planVersion.featuresConfig ?? [],
  }

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
              "flex h-[52px] items-center justify-between space-x-1 px-4"
            )}
          >
            <h1 className="truncate text-xl font-bold">All features</h1>
            <FeatureDialog>
              <Button variant="ghost" size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </FeatureDialog>
          </div>

          <Separator />

          <Suspense fallback={null}>
            <FeatureList featuresPromise={api.features.listByActiveProject()} />
          </Suspense>
        </>
      }
      planFeatureList={<PlanFeatureList initialFeatures={initialFeatures} />}
      featureConfig={<FeatureConfig />}
    />
  )
}
