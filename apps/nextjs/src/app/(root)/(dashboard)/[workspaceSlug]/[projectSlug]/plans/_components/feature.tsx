import type { ComponentPropsWithoutRef, ElementRef } from "react"
import { forwardRef } from "react"
import type { UniqueIdentifier } from "@dnd-kit/core"

import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import { Trash2 } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

import { SheetDemo } from "./feature-config-form"
import { FeatureForm } from "./feature-form"

export interface Feature {
  id: UniqueIdentifier
  columnId?: UniqueIdentifier
  content: string
  type: string
}

interface FeatureCardProps {
  feature: Feature
  isFeature?: boolean
  deleteFeature?: (id: UniqueIdentifier) => void
}

export type FeatureType = "Feature"

export interface DragData {
  type: FeatureType
  feature: Feature
}

// A common pitfall when using the DragOverlay
// component is rendering the same component that
// calls useSortable inside the DragOverlay.
// This will lead to unexpected results,
// since there will be an id collision between the
// two components both calling useDraggable with the same id,
// since useSortable is an abstraction on top of useDraggable.
const FeatureCard = forwardRef<
  ElementRef<"div">,
  ComponentPropsWithoutRef<"div"> & FeatureCardProps
>(({ feature, deleteFeature, isFeature, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
        props.className
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{feature.content}</div>
          </div>
          <div className={"ml-auto flex items-center"}>
            <Badge className="mr-2">{feature.type}</Badge>
            {isFeature ? <SheetDemo /> : <FeatureForm />}
            {deleteFeature && (
              <Button
                onClick={() => deleteFeature(feature.id)}
                variant="ghost"
                size={"icon"}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">delete of plan</span>
              </Button>
            )}
          </div>
        </div>
        <div className="text-xs font-medium">{feature.content}</div>
      </div>
      {!isFeature && (
        <>
          <div className="line-clamp-2 text-xs text-muted-foreground">
            {"jakshdk jasdkjhasdk jhaskdjh askdjhasdkjhadkjahsdk ajsdhkasjhsdaks jdhaskjdhaskdjhaskdj askdjhasdkjhasd askjhdas".substring(
              0,
              50
            ) + "..."}
          </div>
          <div className={cn("ml-auto flex items-center text-xs")}>
            1000 calls per $5 USD
          </div>
        </>
      )}
    </div>
  )
})

FeatureCard.displayName = "FeatureCard"

export { FeatureCard }
