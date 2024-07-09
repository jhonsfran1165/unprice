import { Button } from "@builderai/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { Check, ChevronDown } from "lucide-react"
import { EditorBubbleItem, useEditor } from "novel"
import { BACKGROUND_COLORS, TEXT_COLORS } from "~/lib/theme"

interface ColorSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ColorSelector = ({ open, onOpenChange }: ColorSelectorProps) => {
  const { editor } = useEditor()

  if (!editor) return null
  const activeColorItem = TEXT_COLORS.find(({ option }) =>
    editor.isActive("textStyle", { color: option })
  )

  const activeHighlightItem = BACKGROUND_COLORS.find(({ option }) =>
    editor.isActive("highlight", { color: option })
  )

  return (
    <Popover modal open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-2 rounded-none" variant="ghost">
          <span
            className="rounded-sm px-1"
            style={{
              color: activeColorItem?.option,
              backgroundColor: activeHighlightItem?.option,
            }}
          >
            A
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent sideOffset={5} align="start" className="p-1">
        <ScrollArea className="my-1 h-[200px] p-2">
          <div className="mx-1 flex flex-row justify-between space-x-2">
            <div className="w-1/2">
              <div className="mb-2 px-1 font-semibold text-background-textContrast text-sm">
                Color
              </div>
              {TEXT_COLORS.map(({ name, option }) => (
                <EditorBubbleItem
                  key={name}
                  onSelect={() => {
                    editor.commands.unsetColor()

                    editor
                      .chain()
                      .focus()
                      .setColor(option || "")
                      .run()
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-1 py-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-sm border border-background-border px-2 py-1 font-medium"
                      style={{ color: option }}
                    >
                      A
                    </div>
                    <span>{name}</span>
                  </div>
                  {editor.isActive("textStyle", { color: option }) && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </EditorBubbleItem>
              ))}
            </div>
            <div className="w-1/2">
              <div className="mb-2 px-1 font-semibold text-background-textContrast text-sm">
                Background
              </div>
              {BACKGROUND_COLORS.map(({ name, option }) => (
                <EditorBubbleItem
                  key={name}
                  onSelect={() => {
                    editor.commands.unsetHighlight()
                    editor.commands.setHighlight({ color: option })
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-1 py-1 text-sm hover:bg-background-bgHover hover:text-background-textContrast"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-sm border border-background-border px-2 py-1 font-medium"
                      style={{ backgroundColor: option }}
                    >
                      A
                    </div>
                    <span>{name}</span>
                  </div>
                  {editor.isActive("highlight", { color: option }) && <Check className="h-4 w-4" />}
                </EditorBubbleItem>
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
