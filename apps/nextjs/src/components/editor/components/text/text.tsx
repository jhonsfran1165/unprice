import { useEditor, useNode } from "@craftjs/core"
import ContentEditable from "react-contenteditable"

import { cn } from "@builderai/ui/utils"
import { TextSettings } from "./settings"

export type TextProps = React.CSSProperties & {
  shadow: number
  text: string
}

const defaultProps = {
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
  text: "Text",
  fontSize: 15,
  textAlign: "left",
  fontWeight: "500",
} as TextProps

export const TextComponent = (props: Partial<TextProps>) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode()
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

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
    shadow,
  } = {
    ...props,
  }

  return (
    <ContentEditable
      innerRef={connect}
      html={text ?? ""}
      disabled={!enabled}
      onChange={(e) => {
        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        setProp((prop) => (prop.text = e.target.value), 500)
      }} // use true to disable editing
      tagName="div" // Use a custom HTML tag (uses a div by default)
      className={cn(
        "border-input-none ring-offset-none focus:border-ring-none focus-visible:ring-none w-full rounded-none border-none transition-colors file:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      )}
      style={{
        width: "100%",
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        margin: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        color: color,
        fontSize: `${fontSize}px`,
        textShadow: `0px 0px 2px rgba(0,0,0,${(shadow || 0) / 100})`,
        fontWeight,
        textAlign,
      }}
    />
  )
}

TextComponent.craft = {
  displayName: "Text",
  props: defaultProps,
  related: {
    toolbar: TextSettings,
  },
}
