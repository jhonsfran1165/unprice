import { useNode } from "@craftjs/core"
import type React from "react"
import { ContainerSettings } from "./settings"

export type ContainerProps = {
  margin?: number
  padding?: number
  background: string
}

export const ContainerElement = ({
  margin = 0,
  padding = 0,
  background,
  children,
}: ContainerProps & {
  children: React.ReactNode
}) => {
  const {
    connectors: { connect },
  } = useNode()


  return (
    <div
      style={{ margin: `${margin}px`, padding: `${padding}px` }}
      ref={connect}
      className={"space-y-6 rounded-none border flex flex-col"}
    >
      {children}
    </div>
  )
}

ContainerElement.craft = {
  displayName: "Container",
  props: {
    margin: 0,
    padding: 0,
  },
  related: {
    toolbar: ContainerSettings,
  },
}
