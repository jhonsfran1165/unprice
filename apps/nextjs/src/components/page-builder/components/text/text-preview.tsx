import type { TextComponentProps } from "./types"

export const TextComponentPreview = (props: Partial<TextComponentProps>) => {
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
        "block w-full rounded-none border-input-none border-none ring-offset-none transition-colors file:border-0 focus:border-ring-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-none focus-visible:ring-offset-0"
      }
      style={{
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
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
