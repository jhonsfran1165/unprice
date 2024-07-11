export type ContainerProps = React.CSSProperties & {
  fillSpace: string
  shadow: number
  radius: number
}

export const ContainerElementPreview = (
  props: Partial<ContainerProps> & {
    children: React.ReactNode
  }
) => {
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
    height,
    width,
    children,
  } = props

  return (
    <div
      style={{
        height,
        width,
        justifyContent,
        gap: gap,
        flexDirection,
        alignItems,
        border: `${border}px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        boxShadow: shadow === 0 ? "none" : `0px 3px 100px ${shadow}px rgba(0, 0, 0, 0.13)`,
        borderRadius: `${radius}px`,
        flexGrow: fillSpace === "yes" ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}
