"use client"

import { Separator } from "@builderai/ui/separator"

import { useActiveFeature } from "../../_components/use-features"
import { FeatureConfigForm } from "./feature-config-form"

export function FeatureConfig({
  setDialogOpen,
  formId,
}: {
  setDialogOpen?: (open: boolean) => void
  formId: string
}) {
  const [activeFeature] = useActiveFeature()

  return (
    <div className="my-2 flex flex-1 flex-col">
      {activeFeature ? (
        <div className="flex flex-col">
          <Separator />
          <div className="flex items-start py-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="grid gap-1">
                <div className="line-clamp-1 text-lg font-semibold">
                  {activeFeature.feature.title}
                </div>
                <div className="line-clamp-1 text-xs">
                  slug: <b>{activeFeature.feature.slug}</b>
                </div>
                <div className="line-clamp-1 text-xs">
                  description:{" "}
                  <b>{activeFeature.feature.description ?? "No description"}</b>
                </div>
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {activeFeature.id}
            </div>
          </div>
          <Separator />

          <div className="flex-1 space-y-8 p-4 py-10 text-sm">
            <FeatureConfigForm
              setDialogOpen={setDialogOpen}
              formId={formId}
              feature={activeFeature}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No feature selected
        </div>
      )}
    </div>
  )
}
