"use client"

export * from "./ToolbarSection"
export * from "./ToolbarItemArray"
export * from "./ToolbarItemRadio"
export * from "./ToolbarItemSelector"
export * from "./ToolbarItemText"
export * from "./ToolbarItemDropdown"
export * from "./ToolbarItemSlider"

import { useEditor } from "@craftjs/core"
import React, { useMemo } from "react"

export const Toolbar = () => {
  const { selectedNodes, relatedToolbars } = useEditor((state, query) => {
    const selectedNodeIds = query.getEvent("selected").all()
    return {
      selectedNodes: selectedNodeIds,
      relatedToolbars: selectedNodeIds
        .map((id) => state.nodes[id]?.related?.toolbar)
        .filter(Boolean),
    }
  })

  const toolbars = useMemo(() => {
    return relatedToolbars.map((ToolbarComponent, index) => (
      <React.Fragment key={index.toString()}>
        {ToolbarComponent && React.createElement(ToolbarComponent)}
      </React.Fragment>
    ))
  }, [relatedToolbars])

  if (selectedNodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-5 py-10 text-center">
        <h2 className="pb-6 text-md">Click on a component to start editing.</h2>
        <p className="text-sm">
          You could also double click on the layers below to edit their names, like in Photoshop
        </p>
      </div>
    )
  }

  return <div className="h-full pt-1">{toolbars}</div>
}
