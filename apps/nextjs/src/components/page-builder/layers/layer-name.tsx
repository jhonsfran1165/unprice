import { useEditor } from "@craftjs/core"
import { useLayer } from "@craftjs/layers"
import { Input } from "@unprice/ui/input"
import { cn } from "@unprice/ui/utils"
import { useState } from "react"

export const LayerName = ({
  className,
}: {
  className?: string
}) => {
  const { id } = useLayer()

  const { displayName, actions } = useEditor((state) => ({
    displayName:
      state.nodes[id]! && state.nodes[id].data.custom.displayName
        ? state.nodes[id].data.custom.displayName
        : state.nodes[id]!.data.displayName,
    hidden: state.nodes[id]! && state.nodes[id].data.hidden,
  }))

  const [editingName, setEditingName] = useState(false)
  const [initialName, setInitialName] = useState(displayName)

  return (
    <Input
      className={cn(
        "flex flex-1 border-none bg-transparent px-0 py-2.5 font-primary font-semibold leading-none tracking-tight focus:border-none focus-visible:ring-0 active:border-none",
        className
      )}
      value={initialName}
      readOnly={!editingName}
      onChange={(e) => {
        setInitialName(e.target.value)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditingName(false)
          actions.setCustom(
            id,
            (custom: {
              displayName: string
            }) => {
              custom.displayName = initialName
            }
          )
        }
      }}
      onBlur={() => {
        setEditingName(false)
        actions.setCustom(
          id,
          (custom: {
            displayName: string
          }) => {
            custom.displayName = initialName
          }
        )
      }}
      onDoubleClick={() => {
        setEditingName(true)
      }}
    />
  )
}
