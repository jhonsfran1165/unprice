import { useMemo, useState } from "react"
import type { AnimateLayoutChanges } from "@dnd-kit/sortable"
import {
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva } from "class-variance-authority"
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

import { DroppableContainer } from "./droppable"
import type { Feature } from "./feature-card"
import { FeatureCard } from "./feature-card"
import { FeatureGroupEmptyPlaceholder } from "./feature-group-place-holder"
import type { Column, Id } from "./types"

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
  deleteColumn: (id: Id) => void
  deleteFeature: (id: Id) => void
  updateColumn: (id: Id, title: string) => void
}

export function BoardColumn({
  column,
  features,
  isOverlay,
  deleteColumn,
  updateColumn,
  deleteFeature,
}: BoardColumnProps) {
  const featuresIds = useMemo(() => {
    return features.map((task) => task.id)
  }, [features])

  const [isEditing, setIsEditing] = useState(false)

  console.log("features", features)

  const {
    active,
    attributes,
    isDragging,
    listeners,
    over,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
    animateLayoutChanges,
  })

  // const isOverContainer = over
  //   ? (column.id === over.id && active?.data.current?.type !== "Column") ||
  //     features.includes(over.id)
  //   : false

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
  }

  const variants = cva(
    "h-[500px] max-h-[500px] w-full border rounded-sm flex flex-col flex-shrink-0 snap-center space-y-2 bg-background-base",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    }
  )

  return (
    <AccordionItem
      ref={setNodeRef}
      // ref={disabled ? undefined : setNodeRef}
      value={column.id.toString()}
      className="border-b-0"
      style={style}
    >
      <AccordionTrigger className="p-2">
        <div className=" flex w-full flex-row items-center justify-between space-x-2 space-y-0  font-semibold">
          <Button
            variant={"ghost"}
            size={"sm"}
            {...attributes}
            {...listeners}
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
            {...attributes}
            {...listeners}
            onClick={() => deleteColumn(column.id)}
          >
            <span className="sr-only">{`Move group: ${column.title}`}</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="flex flex-col">
          <DroppableContainer
            className="my-2 h-[600px] rounded-md border bg-background"
            column={column}
          >
            <div className="flex flex-col gap-2 p-2">
              {features.length === 0 && <FeatureGroupEmptyPlaceholder />}
              <SortableContext items={featuresIds}>
                {features.map((feature) => (
                  <FeatureCard
                    deleteFeature={deleteFeature}
                    key={feature.id}
                    feature={feature}
                  />
                ))}
              </SortableContext>
            </div>
          </DroppableContainer>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  )
}
