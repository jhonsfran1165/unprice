export type TextProps = React.CSSProperties & {
  shadow: number
  text: string
}

export const TextComponentPreview = (props: Partial<TextProps>) => {
  const {
    text,
    color,
    fontSize,
    fontWeight,
    textAlign,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    backgroundColor,
    shadow,
  } = {
    ...props,
  }

  return (
    <div
      className={
        "w-full rounded-none border-input-none border-none ring-offset-none transition-colors file:border-0 focus:border-ring-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-none focus-visible:ring-offset-0"
      }
      style={{
        width: "100%",
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        color: color,
        fontSize: `${fontSize}px`,
        textShadow: `0px 0px 2px rgba(0,0,0,${(shadow || 0) / 100})`,
        fontWeight,
        textAlign,
        backgroundColor,
      }}
    >
      {text}
    </div>
  )
}
