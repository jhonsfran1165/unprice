import type { ComponentProps, ElementRef } from "react"
import { forwardRef } from "react"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { ChevronRight } from "lucide-react"

import type { PlanVersionFeature } from "@builderai/db/validators"
import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"

import { FeatureForm } from "../../../_components/feature-form"

const featureVariants = cva(
  "flex gap-2 rounded-lg border text-left text-sm transition-all",
  {
    variants: {
      variant: {
        feature:
          "h-10 px-2 items-center bg-background-bg  hover:bg-background-bgHover disabled:opacity-50",
        default: "flex-col items-start p-3 hover:bg-accent",
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
  setActiveFeature?: (id: string) => void
}

// A common pitfall when using the DragOverlay
// component is rendering the same component that
// calls useSortable inside the DragOverlay.
// This will lead to unexpected results,
// since there will be an id collision between the
// two components both calling useDraggable with the same id,
// since useSortable is an abstraction on top of useDraggable.
// To avoid this, make sure that the component that calls useSortable
// is not rendered inside the DragOverlay so basically this component renders the DragOverlay
// and for the sortable feature we have a separate component that wraps the feature card
// and calls useSortable
const FeaturePlan = forwardRef<ElementRef<"div">, FeaturePlanProps>(
  (props, ref) => {
    const {
      isOverlay,
      mode,
      setActiveFeature,
      variant,
      className,
      feature,
      ...rest
    } = props

    const handleClick = (_event: React.MouseEvent<HTMLDivElement>) => {
      setActiveFeature?.(feature.id)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        setActiveFeature?.(feature.id)
      }
    }

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(featureVariants({ variant, className }))}
        onClick={handleClick}
        onKeyDown={handleKeyDown} // Add onKeyDown event listener
        role="button" // Add the role attribute to indicate interactive nature
        tabIndex={0} // Add tabIndex to make it focusable
      >
        {mode === "Feature" ? (
          <>
            <FeatureForm
              projectSlug={"projectSlug"}
              mode="edit"
              feature={feature}
            />

            <span className={cn("truncate text-sm font-medium")}>
              {feature.title}
            </span>
            <span className={cn("ml-auto")}>
              <ChevronRight className="mr-2 h-4 w-4" />
            </span>
          </>
        ) : mode === "FeaturePlan" ? (
          <>
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {feature.title.substring(0, 30) + "..."}
                  </div>

                  {!feature?.config && (
                    <span className="flex h-2 w-2 rounded-full bg-info-solid" />
                  )}
                </div>
                <div className={cn("ml-auto text-xs")}>{"$5"}</div>
              </div>
              <div className="text-xs font-medium">{feature.slug}</div>
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {feature?.description?.substring(0, 300) + "..."}
            </div>

            {feature.type && (
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariantFromType(feature.type)}>
                  {feature.type}
                </Badge>
              </div>
            )}
          </>
        ) : null}
      </div>
    )
  }
)

function getBadgeVariantFromType(
  type: string
): ComponentProps<typeof Badge>["variant"] {
  if (["flat"].includes(type.toLowerCase())) {
    return "default"
  }

  if (["metered"].includes(type.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}

FeaturePlan.displayName = "FeatureCard"

export { FeaturePlan }
