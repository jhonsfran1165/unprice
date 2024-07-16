import { Button } from "@builderai/ui/button"
import { cn } from "@builderai/ui/utils"

import { Input } from "@builderai/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { Check, Trash } from "lucide-react"
import { useEditor } from "novel"
import { useEffect, useRef } from "react"
import { toastAction } from "~/lib/toast"

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (_e) {
    return false
  }
}
export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString()
    }
  } catch (_e) {
    return null
  }
}
interface LinkSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { editor } = useEditor()

  // Autofocus on input by default
  useEffect(() => {
    inputRef.current?.focus()
  })
  if (!editor) return null

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 rounded-none border-none">
          <p
            className={cn("tex-background-text text-base", {
              "text-info": editor.isActive("link"),
            })}
          >
            ↗
          </p>
          <p
            className={cn("underline decoration-background-text underline-offset-4", {
              "text-info decoration-info": editor.isActive("link"),
            })}
          >
            Link
          </p>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0" sideOffset={10}>
        <form
          onSubmit={(e) => {
            const target = e.currentTarget as HTMLFormElement
            e.preventDefault()
            const input = target[0] as HTMLInputElement
            const url = getUrlFromString(input.value)

            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            } else {
              toastAction("error", "Invalid link")
            }
          }}
          className="flex items-center space-x-1 p-1"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Paste a link"
            defaultValue={editor.getAttributes("link").href || ""}
          />
          {editor.getAttributes("link").href ? (
            <Button
              size="icon"
              variant="destructive"
              type={"submit"}
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                inputRef.current!.value = ""
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" value={"primary"} type={"submit"}>
              <Check className="h-4 w-4" />
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}
