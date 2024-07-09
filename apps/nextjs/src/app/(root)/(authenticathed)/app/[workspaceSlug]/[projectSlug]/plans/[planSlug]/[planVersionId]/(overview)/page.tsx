import { Provider } from "jotai"
import { PlusIcon } from "lucide-react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Fragment, Suspense } from "react"

import { Button } from "@builderai/ui/button"
import { Card } from "@builderai/ui/card"
import { Separator } from "@builderai/ui/separator"
import { cn } from "@builderai/ui/utils"

import { api } from "~/trpc/server"
import DragDrop from "../../../_components/drag-drop"
import { FeatureDialog } from "../../../_components/feature-dialog"
import { ResizablePanelConfig } from "../../../_components/resizable"
import { FeatureList } from "../../_components/feature-list"
import { PlanFeatureList } from "../../_components/plan-feature-list"

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
  const { planVersion } = await api.planVersions.getById({
    id: params.planVersionId,
  })

  if (!planVersion) {
    notFound()
  }

  const layout = cookies().get("react-resizable-panels:layout")

  const defaultLayout = layout?.value ? (JSON.parse(layout.value) as [number, number]) : [30, 70]

  return (
    <Provider>
      <Card className="w-full">
        <DragDrop>
          <ResizablePanelConfig
            defaultLayout={defaultLayout}
            // TODO: add suspense component
            featureList={
              <Fragment>
                <div className={cn("flex h-[70px] items-center justify-between space-x-1 px-4")}>
                  <h1 className="truncate font-bold text-xl">All features</h1>
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
              </Fragment>
            }
            planFeatureList={<PlanFeatureList planVersion={planVersion} />}
          />
        </DragDrop>
      </Card>
    </Provider>
  )
}
