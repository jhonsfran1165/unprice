import { Suspense } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Provider } from "jotai"
import { PlusIcon } from "lucide-react"

import { cn } from "@builderai/ui"
import { Button } from "@builderai/ui/button"
import { Card } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"

import { api } from "~/trpc/server"
import Stepper from "../_components/stepper"
import VersionOverview from "../_components/version-overview"
import { FeatureList } from "../../_components/feature-list"
import { PlanFeatureList } from "../../_components/plan-feature-list"
import DragDrop from "../../../_components/drag-drop"
import { FeatureDialog } from "../../../_components/feature-dialog"
import { ResizablePanelConfig } from "../../../_components/resizable"

export default async function OverviewVersionPage({
  params,
}: {
  params: {
    workspaceSlug: string
    projectSlug: string
    planSlug: string
    planVersionId: string
  }
}) {
  const { planSlug, planVersionId, workspaceSlug, projectSlug } = params

  const { planVersion } = await api.planVersions.getById({
    id: planVersionId,
  })

  if (!planVersion) {
    notFound()
  }

  const layout = cookies().get("react-resizable-panels:layout")

  const defaultLayout = layout?.value
    ? (JSON.parse(layout.value) as [number, number])
    : [30, 70]

  return (
    <Provider>
      <div className="flex flex-col-reverse items-start gap-4 sm:py-0 md:gap-6 lg:flex-row">
        <div className="flex w-full flex-col lg:w-1/4">
          <VersionOverview planVersion={planVersion} />
        </div>
        <div className="flex w-full flex-1 flex-row items-start gap-2 lg:w-3/4">
          <Card className="w-full overflow-hidden">
            <DragDrop>
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
                      <h1 className="truncate text-xl font-bold">
                        All features
                      </h1>
                      <FeatureDialog>
                        <Button variant="default" size="sm">
                          <PlusIcon className="h-3.5 w-3.5" />
                        </Button>
                      </FeatureDialog>
                    </div>

                    <Separator />

                    <Suspense fallback={<div>loading</div>}>
                      <FeatureList
                        planVersion={planVersion}
                        featuresPromise={api.features.listByActiveProject()}
                      />
                    </Suspense>
                  </>
                }
                planFeatureList={<PlanFeatureList planVersion={planVersion} />}
              />
            </DragDrop>
          </Card>
          <Stepper
            className="flex flex-col px-2 sm:px-4"
            step="overview"
            baseUrl={`/${workspaceSlug}/${projectSlug}/plans/${planSlug}/${planVersion.id}`}
          />
        </div>
      </div>
    </Provider>
  )
}
