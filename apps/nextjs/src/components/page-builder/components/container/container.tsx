import type React from "react"
import { ContainerSettings } from "./settings"

import { Resizer } from "./resizer"

export type ContainerProps = React.CSSProperties & {
  fillSpace: string
  shadow: number
  radius: number
}

const defaultProps = {
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  fillSpace: "no",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
  color: "black",
  shadow: 0,
  radius: 0,
  gap: 10,
  width: "100%",
  height: "auto",
  backgroundColor: "var(--sand-3)",
} as ContainerProps

export const ContainerElement = (props: Partial<ContainerProps> & {
  children: React.ReactNode
}) => {
  const {
    flexDirection = "column",
    alignItems,
    justifyContent,
    color,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    gap,
    shadow,
    radius,
    fillSpace,
    backgroundColor,
    border,
    borderColor,
    children
  } = props

  return (
    <Resizer
      propKey={{ width: 'width', height: 'height' }}
      style={{
        justifyContent,
        gap: gap,
        flexDirection,
        alignItems,
        border: `${border}px solid ${borderColor}`,
        borderColor,
        backgroundColor: backgroundColor,
        color: color,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        boxShadow: shadow === 0 ? "none" : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        flexShrink: fillSpace === "yes" ? 1 : 0,
      }}
    >
      {children}
    </Resizer>
  )
}

ContainerElement.craft = {
  displayName: "Container",
  props: defaultProps,
  rules: {
    canDrag: () => true,
  },
  related: {
    toolbar: ContainerSettings,
  },
}
