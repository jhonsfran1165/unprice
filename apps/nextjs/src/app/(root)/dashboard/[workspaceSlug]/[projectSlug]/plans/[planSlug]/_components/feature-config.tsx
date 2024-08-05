"use client"

import { Separator } from "@unprice/ui/separator"

import { CopyButton } from "~/components/copy-button"
import { useActiveFeature, useActivePlanVersion } from "../../_components/use-features"
import { FeatureConfigForm } from "./feature-config-form"

export function FeatureConfig({
  setDialogOpen,
}: {
  setDialogOpen?: (open: boolean) => void
}) {
  const [activeFeature] = useActiveFeature()
  const [activePlanVersion] = useActivePlanVersion()

  return (
    <div className="my-2 flex flex-1 flex-col">
      {activeFeature ? (
        <div className="flex flex-col">
          <Separator />
          <div className="flex items-start py-4 text-sm">
            <div className="grid gap-1">
              <div className="line-clamp-1 pb-2 font-semibold text-lg">
                {activeFeature.feature.title}{" "}
                <CopyButton value={activeFeature.id} className="size-4" />
              </div>
              <div className="line-clamp-1 text-xs">
                <b>slug:</b> {activeFeature.feature.slug}
              </div>
              <div className="text-xs">
                <b>description: </b>
                {activeFeature.feature.description ?? "No description"}
              </div>
            </div>
          </div>
          <Separator />

          <div className="flex-1 space-y-8 py-10 text-sm">
            <FeatureConfigForm
              setDialogOpen={setDialogOpen}
              defaultValues={activeFeature}
              planVersion={activePlanVersion}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">No feature selected</div>
      )}
    </div>
  )
}
