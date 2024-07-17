import { Button } from "@builderai/ui/button"
import { cn } from "@builderai/ui/utils"
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react"
import { EditorBubbleItem, useEditor } from "novel"

export const AlignTextButtons = () => {
  const { editor } = useEditor()
  if (!editor) return null

  return (
    <div className="flex">
      <EditorBubbleItem
        onSelect={(editor) => {
          editor.chain().focus().setTextAlign("left").run()
        }}
      >
        <Button size="sm" className="rounded-none" variant="ghost">
          <AlignLeft
            className={cn("h-4 w-4", {
              "text-info": editor!.isActive({ textAlign: "left" }),
            })}
          />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={(editor) => {
          editor.chain().focus().setTextAlign("center").run()
        }}
      >
        <Button size="sm" className="rounded-none" variant="ghost">
          <AlignCenter
            className={cn("h-4 w-4", {
              "text-info": editor!.isActive({ textAlign: "center" }),
            })}
          />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={(editor) => {
          editor.chain().focus().setTextAlign("right").run()
        }}
      >
        <Button size="sm" className="rounded-none" variant="ghost">
          <AlignRight
            className={cn("h-4 w-4", {
              "text-info": editor!.isActive({ textAlign: "right" }),
            })}
          />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={(editor) => {
          editor.chain().focus().setTextAlign("justify").run()
        }}
      >
        <Button size="sm" className="rounded-none" variant="ghost">
          <AlignJustify
            className={cn("h-4 w-4", {
              "text-info": editor!.isActive({ textAlign: "justify" }),
            })}
          />
        </Button>
      </EditorBubbleItem>
    </div>
  )
}
