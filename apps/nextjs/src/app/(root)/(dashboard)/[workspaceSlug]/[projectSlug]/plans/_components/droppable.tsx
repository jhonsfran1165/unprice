import React from "react"
import { useDroppable } from "@dnd-kit/core"

export function Droppable(props: {
  children: React.ReactNode
  className?: string
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "feature-config",
  })
  const style = {
    color: isOver ? "green" : undefined,
    opacity: isOver ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={props.className}>
      {props.children}
    </div>
  )
}
