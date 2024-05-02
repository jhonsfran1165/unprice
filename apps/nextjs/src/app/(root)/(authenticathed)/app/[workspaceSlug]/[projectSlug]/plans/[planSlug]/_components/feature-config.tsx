"use client"

import { Button } from "@builderai/ui/button"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Separator } from "@builderai/ui/separator"

import { useActiveFeature } from "../../_components/use-features"
import { FeatureConfigForm } from "./feature-config-form"

export function FeatureConfig() {
  const [activeFeature] = useActiveFeature()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[52px] shrink-0 items-center justify-between space-x-1 px-4 py-2">
        <h1 className="truncate text-xl font-bold">Features on this plan</h1>
      </div>

      <Separator />

      {activeFeature ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="grid gap-1">
                <div className="line-clamp-1 text-lg font-semibold">
                  {activeFeature.title}
                </div>
                <div className="line-clamp-1 text-xs">
                  slug: <b>{activeFeature.slug}</b>
                </div>
                <div className="line-clamp-1 text-xs">
                  description:{" "}
                  <b>{activeFeature.description ?? "No description"}</b>
                </div>
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {activeFeature.id}
            </div>
          </div>
          <Separator />

          <ScrollArea className="h-[680px] pb-4">
            <div className="flex-1 space-y-8 p-4 text-sm">
              <FeatureConfigForm
                formId={"feature-config-form"}
                feature={activeFeature}
              />
            </div>
          </ScrollArea>

          <Separator className="mt-auto" />

          <div className="flex h-[60px] shrink-0 flex-col p-4">
            <div className="flex items-center">
              <Button
                type="submit"
                form="feature-config-form"
                size="sm"
                className="ml-auto truncate"
              >
                Save configuration
              </Button>
            </div>
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
