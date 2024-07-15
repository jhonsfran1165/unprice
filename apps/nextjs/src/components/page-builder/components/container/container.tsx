import { ContainerSettings } from "./settings"

import type { UserComponent } from "@craftjs/core"
import { Resizer } from "./resizer"
import type { ContainerComponentProps } from "./types"

const defaultProps = {
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  fillSpace: true,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  marginBottom: 0,
  shadow: 0,
  radius: 0,
  gap: 10,
  width: "100%",
  height: "auto",
  backgroundColor: "var(--sand-3)",
} as ContainerComponentProps

export const ContainerElement: UserComponent<ContainerComponentProps> = (props) => {
  const {
    flexDirection = "column",
    alignItems,
    justifyContent,
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
    children,
  } = props

  return (
    <Resizer
      propKey={{ width: "width", height: "height" }}
      style={{
        display: "flex",
        justifyContent,
        gap: gap,
        flexDirection,
        flexWrap: "wrap",
        alignItems,
        border: `${border}px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        boxShadow: shadow === 0 ? "none" : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        flexGrow: fillSpace ? 1 : 0,
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
