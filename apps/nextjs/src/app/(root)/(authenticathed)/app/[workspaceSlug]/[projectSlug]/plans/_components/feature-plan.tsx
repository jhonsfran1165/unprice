"use client"

import type { ElementRef } from "react"
import { forwardRef } from "react"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { ChevronRight, Settings2, Trash2 } from "lucide-react"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"

import { Ping } from "~/components/ping"
import { FeatureDialog } from "./feature-dialog"
import {
  useActiveFeature,
  usePlanActiveTab,
  usePlanFeaturesList,
} from "./use-features"

const featureVariants = cva(
  "flex gap-2 rounded-lg border text-left text-sm transition-all bg-background-bgSubtle hover:bg-background-bgHover",
  {
    variants: {
      variant: {
        feature: "h-10 px-2 items-center  disabled:opacity-50",
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
  feature: PlanVersionFeature
  mode: "Feature" | "FeaturePlan"
  isOverlay?: boolean
}

const FeaturePlan = forwardRef<ElementRef<"div">, FeaturePlanProps>(
  (props, ref) => {
    const { mode, variant, className, feature, ...rest } = props

    const [active, setActiveFeature] = useActiveFeature()
    const [planActiveTab] = usePlanActiveTab()
    const [_planFeatures, setPlanFeatures] = usePlanFeaturesList()

    const handleClick = (_event: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== "FeaturePlan") return
      setActiveFeature(feature)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        if (mode !== "FeaturePlan") return

        setActiveFeature(feature)
      }
    }

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(featureVariants({ variant, className }), {
          "border-2 border-background-borderHover bg-background-bgHover shadow-lg":
            mode === "FeaturePlan" && active?.id === feature.id,
        })}
        onClick={handleClick}
        onKeyDown={handleKeyDown} // Add onKeyDown event listener
        role="button" // Add the role attribute to indicate interactive nature
        tabIndex={0} // Add tabIndex to make it focusable
      >
        {mode === "Feature" ? (
          <>
            <FeatureDialog defaultValues={feature}>
              <Button variant="link" size={"icon"}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </FeatureDialog>

            <span className={cn("w-full truncate text-sm font-medium")}>
              {feature.title}
            </span>
            <Button
              variant="link"
              size={"icon"}
              onClick={() => {
                setPlanFeatures((prev) => {
                  return {
                    ...prev,
                    [planActiveTab]: [...prev[planActiveTab], feature],
                  }
                })

                setActiveFeature(feature)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : mode === "FeaturePlan" ? (
          <>
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="line-clamp-1 items-center gap-1 text-left font-bold">
                  {feature.slug}
                  <p className="line-clamp-1 text-xs font-normal text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {feature.type === "flat"
                    ? `${
                        feature?.config?.price === 0
                          ? "Free"
                          : `$${feature?.config?.price}`
                      }`
                    : ["usage", "tier"].includes(feature.type)
                      ? `${feature?.config?.tiers.length ?? 0} tiers`
                      : null}

                  {/* // TODO: change this beside the name and use isValid */}
                  {!feature?.config && (
                    <div className="relative ">
                      <div className="absolute -top-1 right-0">
                        <Ping variant={"destructive"} />
                      </div>
                    </div>
                  )}

                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()

                        if (active?.id === feature.id) {
                          setActiveFeature(null)
                        }

                        // delete feature
                        setPlanFeatures((features) => {
                          const activeFeatures = features[planActiveTab]
                          const filteredFeatures = activeFeatures.filter(
                            (f) => f.id !== feature.id
                          )

                          return {
                            ...features,
                            [planActiveTab]: filteredFeatures,
                          }
                        })

                        // TODO: save here
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete from plan</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {feature.type && (
              <div className="flex items-center gap-2">
                <Badge>{feature.type}</Badge>
              </div>
            )}
          </>
        ) : null}
      </div>
    )
  }
)

FeaturePlan.displayName = "FeatureCard"

export { FeaturePlan }
