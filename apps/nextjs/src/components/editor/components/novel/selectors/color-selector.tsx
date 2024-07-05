import { Check, ChevronDown } from "lucide-react"
import { EditorBubbleItem, useEditor } from "novel"

import {
  defaultTheme,
  generateTheme,
  type generateVariantRadixColors,
} from "@builderai/tailwind-config"
import { Button } from "@builderai/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"


export interface BubbleColorMenuItem {
  name: string
  color: string
}

const themeData = generateTheme(defaultTheme)

// you might wonder why we are using this function to define the color
// this is because we want to support dark mode and light mode out of the box with radix colors
const defineColor = (color: string, variant: keyof ReturnType<typeof generateVariantRadixColors>) => {
  const colors = themeData.colors[color] as Record<string, string>
  const radixColor = colors[variant]
  return radixColor ?? color
}

const TEXT_COLORS: BubbleColorMenuItem[] = [
  {
    name: "Default",
    color: defineColor("background", "text"),
  },
  {
    name: "Green",
    color: defineColor("success", "DEFAULT"),
  },
  {
    name: "Red",
    color: defineColor("error", "DEFAULT"),
  },
  {
    name: "Yellow",
    color: defineColor("warning", "DEFAULT"),
  },
  {
    name: "Blue",
    color: defineColor("info", "DEFAULT"),
  },
  {
    name: "Black",
    color: defineColor("black", "DEFAULT"),
  },
  {
    name: "White",
    color: defineColor("white", "DEFAULT"),
  },
  {
    name: "Gray",
    color: defineColor("gray", "DEFAULT"),
  },
]

const HIGHLIGHT_COLORS: BubbleColorMenuItem[] = [
  {
    name: "Default",
    color: defineColor("background", "bg"),
  },
  {
    name: "Green",
    color: defineColor("success", "bg"),
  },
  {
    name: "Red",
    color: defineColor("error", "bg"),
  },
  {
    name: "Yellow",
    color: defineColor("warning", "bg"),
  },
  {
    name: "Blue",
    color: defineColor("info", "bg"),
  },
  {
    name: "Black",
    color: defineColor("black", "DEFAULT"),
  },
  {
    name: "White",
    color: defineColor("white", "DEFAULT"),
  },
  {
    name: "Gray",
    color: defineColor("gray", "bg"),
  },
]

interface ColorSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ColorSelector = ({ open, onOpenChange }: ColorSelectorProps) => {
  const { editor } = useEditor()

  if (!editor) return null
  const activeColorItem = TEXT_COLORS.find(({ color }) => editor.isActive("textStyle", { color }))

  const activeHighlightItem = HIGHLIGHT_COLORS.find(({ color }) =>
    editor.isActive("highlight", { color })
  )

  return (
    <Popover modal open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-2 rounded-none" variant="ghost">
          <span
            className="rounded-sm px-1"
            style={{
              color: activeColorItem?.color,
              backgroundColor: activeHighlightItem?.color,
            }}
          >
            A
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent sideOffset={5} align="start" className="p-1">
        <ScrollArea className="h-[200px] p-2 my-1">
          <div className="flex flex-row justify-between space-x-2 mx-1">
            <div className="w-1/2">
              <div className="mb-2 px-1 text-sm font-semibold text-background-textContrast">
                Color
              </div>
              {TEXT_COLORS.map(({ name, color }) => (
                <EditorBubbleItem
                  key={name}
                  onSelect={() => {
                    editor.commands.unsetColor()

                    editor
                      .chain()
                      .focus()
                      .setColor(color || "")
                      .run()
                  }}
                  className="rounded-sm flex cursor-pointer items-center justify-between py-1 px-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-sm border border-background-border px-2 py-px font-medium"
                      style={{ color }}
                    >
                      A
                    </div>
                    <span>{name}</span>
                  </div>
                  {editor.isActive("textStyle", { color }) && <Check className="ml-2 h-4 w-4" />}
                </EditorBubbleItem>
              ))}
            </div>
            <div className="w-1/2">
              <div className="mb-2 px-1 text-sm font-semibold text-background-textContrast">
                Background
              </div>
              {HIGHLIGHT_COLORS.map(({ name, color }) => (
                <EditorBubbleItem
                  key={name}
                  onSelect={() => {
                    editor.commands.unsetHighlight()
                    editor.commands.setHighlight({ color })
                  }}
                  className="rounded-sm flex cursor-pointer items-center justify-between py-1 px-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-sm border border-background-border px-2 py-px font-medium"
                      style={{ backgroundColor: color }}
                    >
                      A
                    </div>
                    <span>{name}</span>
                  </div>
                  {editor.isActive("highlight", { color }) && <Check className="h-4 w-4" />}
                </EditorBubbleItem>
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
