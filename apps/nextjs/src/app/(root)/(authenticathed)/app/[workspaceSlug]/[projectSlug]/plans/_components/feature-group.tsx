import type { AnimateLayoutChanges } from "@dnd-kit/sortable"
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { useState } from "react"

import { cn } from "@builderai/ui"
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@builderai/ui/accordion"
import { Button } from "@builderai/ui/button"
import { Trash2 } from "@builderai/ui/icons"
import { Input } from "@builderai/ui/input"
import type { Group, GroupType } from "@builderai/validators/price"

export interface GroupDragData {
  type: GroupType
  group: Group
}

export const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

interface FeatureGroupProps {
  children: React.ReactNode
  group: Group
  disabled?: boolean
  deleteGroup: (id: string) => void
  updateGroup: (id: string, title: string) => void
}

export function FeatureGroup({
  children,
  group,
  disabled,
  deleteGroup,
  updateGroup,
}: FeatureGroupProps) {
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
    id: group.id,
    data: {
      type: "Group",
      group,
    } satisfies GroupDragData,
    attributes: {
      roleDescription: "Group",
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
      value={group.id.toString()}
      style={style}
      className={cn(
        "flex w-full flex-shrink-0 snap-center flex-col space-y-2 rounded-sm border",
        {
          "border-dashed opacity-80": isDragging,
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
            <span className="sr-only">{`Move group: ${group.title}`}</span>
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="flex w-full items-center justify-center">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)}>
                <h3 className="text-xl font-semibold tracking-tight">
                  {group.title}
                </h3>
              </button>
            )}
            {isEditing && (
              <Input
                className="h-auto w-auto cursor-text border-none p-0 text-center align-middle font-primary text-xl font-semibold tracking-tight text-background-textContrast outline-none ring-0 focus:border-0 focus:ring-0 focus:ring-offset-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                type="text"
                aria-label="Field name"
                value={group.title}
                onChange={(e) => updateGroup(group.id, e.target.value)}
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
            onClick={() => deleteGroup(group.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent className="h-[500px] max-h-[500px] snap-center">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}
