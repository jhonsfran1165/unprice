import { Suspense } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PlusIcon } from "lucide-react"

import type { RouterOutputs } from "@builderai/api"
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

  const defaultLayout = layout?.value
    ? (JSON.parse(layout.value) as [number, number])
    : [30, 70]

  return (
    <ResizablePanelConfig
      defaultLayout={defaultLayout}
      // TODO: add suspense component
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

          <Suspense fallback={<div>loading</div>}>
            <FeatureList
              planVersionId={planVersion.id}
              featuresPromise={api.features.listByActiveProject()}
            />
          </Suspense>
        </>
      }
      planFeatureList={
        <PlanFeatureList initialFeatures={planVersion.planFeatures} />
      }
    />
  )
}
