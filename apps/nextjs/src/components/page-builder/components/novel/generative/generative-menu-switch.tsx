import { EditorBubble, useEditor } from "novel"
import { removeAIHighlight } from "novel/extensions"
import { Fragment, type ReactNode, useEffect } from "react"
import { AISelector } from "./ai-selector"

interface GenerativeMenuSwitchProps {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}
const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor()

  if (!editor) return null

  useEffect(() => {
    if (!open) removeAIHighlight(editor)
  }, [open])
  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false)
          editor.chain().unsetHighlight().run()
        },
        appendTo: () => document.body,
      }}
      className="flex w-fit max-w-[100vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          {/* // TODO: no ai for now */}
          {/* <Button
            className="gap-1 truncate rounded-none text-success"
            variant="ghost"
            onClick={() => onOpenChange(true)}
            size="sm"
          >
            <Magic className="h-5 w-5" />
            Ask AI
          </Button> */}
          {children}
        </Fragment>
      )}
    </EditorBubble>
  )
}

export default GenerativeMenuSwitch
