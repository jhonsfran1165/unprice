import type { ContainerComponentProps } from "./types"

export const ContainerElementPreview = (props: Partial<ContainerComponentProps>) => {
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
    height,
    width,
  } = props

  return (
    <div
      style={{
        height,
        width,
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
    </div>
  )
}
