import { useEffect, useRef } from "react"
import type { UseChatHelpers } from "ai/react"

import { Textarea } from "@builderai/ui/text-area"

import { useEnterSubmit } from "~/lib/use-enter-submit"

export interface PromptProps
  extends Pick<UseChatHelpers, "input" | "setInput"> {
  onSubmit: (value: string) => Promise<void>
  isLoading: boolean
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput("")
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <Textarea
        ref={inputRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Send a message."
        spellCheck={false}
        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
      />
    </form>
  )
}
