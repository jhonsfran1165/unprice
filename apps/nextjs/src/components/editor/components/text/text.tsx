import { useEditor, useNode } from "@craftjs/core"
import ContentEditable from "react-contenteditable"

import { cn } from "@builderai/ui/utils"
import { TextSettings } from "./settings"

export type TextProps = {
  fontSize: string
  textAlign: string
  fontWeight: string
  color: Record<"r" | "g" | "b" | "a", string>
  shadow: number
  text: string
  margin: [string, string, string, string]
}

export const TextComponent = ({
  fontSize,
  textAlign,
  fontWeight,
  color,
  shadow,
  text = "Text",
  margin = ["0", "0", "0", "0"],
}: Partial<TextProps>) => {
  const {
    connectors: { connect },
    setProp,
  } = useNode()
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

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
        margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
        color: `rgba(${Object.values(color)})`,
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
  props: {
    fontSize: "15",
    textAlign: "left",
    fontWeight: "500",
    color: { r: 92, g: 90, b: 90, a: 1 },
    margin: [0, 0, 0, 0],
    shadow: 0,
    text: "Text",
  },
  related: {
    toolbar: TextSettings,
  },
}
