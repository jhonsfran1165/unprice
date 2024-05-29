"use client"

import type { ElementRef } from "react"
import React, { forwardRef, useState } from "react"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { EyeOff, Settings, Trash2, X } from "lucide-react"

import type { PlanVersionFeatureDragDrop } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"

import { Ping } from "~/components/ping"
import { api } from "~/trpc/client"
import { PlanVersionFeatureSheet } from "../[planSlug]/_components/plan-version-feature-sheet"
import { FeatureDialog } from "./feature-dialog"
import {
  useActiveFeature,
  useActivePlanVersion,
  usePlanFeaturesList,
} from "./use-features"

const featureVariants = cva(
  "flex gap-2 rounded-lg border text-left text-sm transition-all bg-background-bgSubtle hover:bg-background-bgHover",
  {
    variants: {
      variant: {
        feature: "h-10 px-2 items-center disabled:opacity-50",
        default: "flex-col items-start p-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FeaturePlanProps
  extends React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof featureVariants> {
  planFeatureVersion: PlanVersionFeatureDragDrop
  mode: "Feature" | "FeaturePlan"
  disabled?: boolean
}

// TODO: there is a bug with the sheet component that allow to drag the feature card
const FeaturePlan = forwardRef<ElementRef<"div">, FeaturePlanProps>(
  (props, ref) => {
    const { mode, variant, className, planFeatureVersion, ...rest } = props
    const [isDelete, setConfirmDelete] = useState<boolean>(false)

    const [active, setActiveFeature] = useActiveFeature()
    const [activePlanVersion] = useActivePlanVersion()

    const [_planFeatures, setPlanFeatures] = usePlanFeaturesList()

    const removePlanVersionFeature =
      api.planVersionFeatures.remove.useMutation()

    const feature = planFeatureVersion.feature

    const handleClick = (_event: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== "FeaturePlan") return
      setActiveFeature(planFeatureVersion)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        if (mode !== "FeaturePlan") return

        setActiveFeature(planFeatureVersion)
      }
    }

    const isPublished = activePlanVersion?.status === "published"

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(featureVariants({ variant, className }), {
          "relative z-0 border-2 border-background-borderHover bg-background-bgHover shadow-sm":
            mode === "FeaturePlan" &&
            active?.featureId === planFeatureVersion.featureId,
        })}
        onClick={handleClick}
        onKeyDown={handleKeyDown} // Add onKeyDown event listener
        role="button" // Add the role attribute to indicate interactive nature
        tabIndex={0} // Add tabIndex to make it focusable
      >
        {mode === "Feature" ? (
          <div className="flex flex-row items-center gap-2">
            <FeatureDialog defaultValues={feature}>
              <Button variant="link" size={"icon"}>
                <Settings className="h-4 w-4" />
              </Button>
            </FeatureDialog>

            <span className={cn("line-clamp-1 w-full text-sm font-medium")}>
              {feature.title.substring(0, 10) + "..."}
            </span>
          </div>
        ) : mode === "FeaturePlan" ? (
          <PlanVersionFeatureSheet>
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-row gap-2">
                    <div className="line-clamp-1 items-center gap-1 text-left font-bold">
                      {feature.slug}
                    </div>
                    {/* // If there is no id it means that the feature is not saved */}
                    {!planFeatureVersion?.id && (
                      <div className="relative">
                        <div className="1right-1 absolute top-2">
                          <Ping variant={"destructive"} />
                        </div>
                      </div>
                    )}
                    {planFeatureVersion.hidden && (
                      <div className="flex items-center gap-1">
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <div className="flex- flex-row gap-1">
                      {!isPublished && isDelete && (
                        <div className="flex flex-row items-center">
                          <Button
                            className="px-0 text-xs font-light"
                            variant="link"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              setConfirmDelete(false)
                            }}
                          >
                            cancel
                            <span className="sr-only">
                              cancel delete from plan
                            </span>
                          </Button>
                          <Button
                            className="px-0"
                            variant="link"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()

                              if (active?.id === feature.id) {
                                setActiveFeature(null)
                              }

                              if (planFeatureVersion.id) {
                                // delete from plan
                                void removePlanVersionFeature.mutateAsync({
                                  id: planFeatureVersion.id,
                                })
                              }

                              // delete feature from the list in the drag and drop
                              setPlanFeatures((features) => {
                                const filteredFeatures = features.filter(
                                  (f) => f.featureId !== feature.id
                                )

                                return filteredFeatures
                              })

                              setConfirmDelete(false)
                            }}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">
                              Confirm delete from plan
                            </span>
                          </Button>
                        </div>
                      )}
                      {!isPublished && !isDelete && (
                        <Button
                          className="px-0"
                          variant="link"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            setConfirmDelete(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete from plan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="line-clamp-1 text-xs font-normal text-muted-foreground">
                {feature.description ?? "No description"}
              </div>

              {planFeatureVersion.featureType && (
                <div className="mt-2 flex w-full flex-row items-center justify-between gap-2">
                  <div className="flex flex-row gap-1">
                    <Badge variant={"secondary"}>
                      {planFeatureVersion.featureType}
                    </Badge>
                    {planFeatureVersion.config?.usageMode && (
                      <Badge>{planFeatureVersion.config.usageMode}</Badge>
                    )}
                    {planFeatureVersion.config?.aggregationMethod && (
                      <Badge>
                        {planFeatureVersion.config.aggregationMethod}
                      </Badge>
                    )}
                    {planFeatureVersion.config?.tierMode && (
                      <Badge>{planFeatureVersion.config.tierMode}</Badge>
                    )}
                  </div>
                  <div className="line-clamp-1 pr-3 text-xs font-normal">
                    {/* // TODO: fix this */}
                    {planFeatureVersion?.config?.price
                      ? `${
                          parseFloat(planFeatureVersion?.config?.price) === 0
                            ? "Free"
                            : planFeatureVersion?.config?.units
                              ? `$${planFeatureVersion?.config?.price} per ${planFeatureVersion?.config?.units} units`
                              : `$${planFeatureVersion?.config?.price}`
                        }`
                      : planFeatureVersion.config?.tiers?.length?.toString()
                        ? `${planFeatureVersion?.config?.tiers?.length ?? 0} tiers`
                        : null}
                  </div>
                </div>
              )}
            </div>
          </PlanVersionFeatureSheet>
        ) : null}
      </div>
    )
  }
)

FeaturePlan.displayName = "FeatureCard"

export { FeaturePlan }
