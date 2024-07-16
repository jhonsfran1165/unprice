import type React from "react"

import { useLayer } from "@craftjs/layers"
import { LayerHeader } from "./layer-header"

export type DefaultLayerProps = {
  children?: React.ReactNode
}

export const LayersEditor = ({ children }: DefaultLayerProps) => {
  const {
    connectors: { layer },
  } = useLayer((layer) => ({
    hovered: layer.event.hovered,
    expanded: layer.expanded,
  }))

  return (
    <div
      ref={(ref) => {
        ref && layer(ref)
      }}
    >
      <LayerHeader />
      {children ? <div>{children}</div> : null}
    </div>
  )
}
