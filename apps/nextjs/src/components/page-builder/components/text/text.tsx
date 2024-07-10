"use client"

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
  color: "var(--sand-11)",
  backgroundColor: "transparent",
  shadow: 0,
  text: "Text",
  fontSize: 15,
  textAlign: "left",
  fontWeight: "500",
} as TextProps

export const TextComponent = (props: Partial<TextProps>) => {
  const {
    connectors: { connect },
    actions: { setProp },
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
    backgroundColor,
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
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        setProp((props: Record<string, any>) => {
          props.text = e.target.value
          return props
        }, 500)
      }}
      tagName="div" // Use a custom HTML tag (uses a div by default)
      className={cn(
        "w-full rounded-none border-input-none border-none ring-offset-none transition-colors file:border-0 focus:border-ring-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-none focus-visible:ring-offset-0"
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
        backgroundColor,
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
