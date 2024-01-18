import { useMemo, useState } from "react"
import type { UniqueIdentifier } from "@dnd-kit/core"
import type { AnimateLayoutChanges } from "@dnd-kit/sortable"
import {
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@builderai/ui/accordion"
import { Button } from "@builderai/ui/button"
import { Trash2 } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { cn } from "@builderai/ui/utils"

import type { Feature } from "./feature"
import { FeatureGroupEmptyPlaceholder } from "./feature-group-place-holder"
import { SortableFeature } from "./sortable-feature"
import type { Column } from "./types"

export type ColumnType = "Column"

export interface ColumnDragData {
  type: ColumnType
  column: Column
}

export const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

interface BoardColumnProps {
  column: Column
  features: Feature[]
  isOverlay?: boolean
  disabled?: boolean
  deleteColumn: (id: UniqueIdentifier) => void
  deleteFeature: (id: UniqueIdentifier) => void
  updateColumn: (id: UniqueIdentifier, title: string) => void
}

export function BoardColumn({
  column,
  features,
  isOverlay,
  disabled,
  deleteColumn,
  updateColumn,
  deleteFeature,
}: BoardColumnProps) {
  const featuresIds = useMemo(() => {
    return features.map((feature) => feature.id)
  }, [features])

  const [isEditing, setIsEditing] = useState(false)

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transition,
    transform,
    setActivatorNodeRef,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: "Column",
    },
    animateLayoutChanges,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <AccordionItem
      ref={disabled ? undefined : setNodeRef}
      value={column.id.toString()}
      style={style}
      className={cn(
        "flex w-full flex-shrink-0 snap-center flex-col space-y-2 rounded-sm border",
        {
          "border-dashed opacity-80": isDragging && !isOverlay,
        }
      )}
    >
      <AccordionTrigger className="h-12 p-2">
        <div className="flex w-full flex-row items-center justify-between space-x-2 space-y-0 font-semibold">
          <Button
            {...attributes}
            {...listeners}
            variant={"ghost"}
            size={"sm"}
            ref={setActivatorNodeRef}
            className="cursor-grab px-1 py-1"
          >
            <span className="sr-only">{`Move group: ${column.title}`}</span>
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="flex w-full items-center justify-center">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)}>
                <h3 className="text-xl font-semibold tracking-tight">
                  {column.title}
                </h3>
              </button>
            )}
            {isEditing && (
              <Input
                autoFocus
                className="h-auto w-auto cursor-text border-none p-0 text-center align-middle font-primary text-xl font-semibold tracking-tight text-background-textContrast outline-none ring-0 focus:border-0 focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                type="text"
                aria-label="Field name"
                value={column.title}
                onChange={(e) => updateColumn(column.id, e.target.value)}
                onBlur={() => {
                  setIsEditing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return
                  setIsEditing(false)
                }}
              />
            )}
          </div>
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => deleteColumn(column.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent className="h-[500px] max-h-[500px] snap-center">
        {features.length === 0 ? (
          <div className="h-full px-3">
            <FeatureGroupEmptyPlaceholder />
          </div>
        ) : (
          <ScrollArea className="h-full px-3">
            <SortableContext items={featuresIds}>
              <div className="space-y-2">
                {features.map((feature) => (
                  <SortableFeature
                    deleteFeature={deleteFeature}
                    key={feature.id}
                    feature={feature}
                  />
                ))}
              </div>
            </SortableContext>
          </ScrollArea>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
