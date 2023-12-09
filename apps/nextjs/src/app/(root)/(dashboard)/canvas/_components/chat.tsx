import { useEffect, useRef, useState } from "react"
import type { Message } from "ai/react"
import { useChat } from "ai/react"

import { Button } from "@builderai/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@builderai/ui/dialog"
import { BotIcon } from "@builderai/ui/icons"
import { ScrollArea } from "@builderai/ui/scroll-area"
import { toast } from "@builderai/ui/use-toast"

import { ChatList } from "./chat-list"
import { ChatPanel } from "./chat-panel"
import { ChatScrollAnchor } from "./chat-scroll-anchor"
import { EmptyChat } from "./empty-chat"
import type { PreviewShape } from "./preview-page-shape"

export interface ChatProps extends React.ComponentProps<"div"> {
  initialMessages?: Message[]
  shape: PreviewShape
}

export function ChatDemo({ shape, initialMessages: initial }: ChatProps) {
  const [initialMessages, setInitialMessages] = useState(initial)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const id = shape.id.replace(/^shape:/, "").replace("page_", "")
  const html = shape?.props?.html || ""

  useEffect(() => {
    const getChats = async () => {
      const res = await fetch(`/api/chat?id=${id}`)
      const data = (await res.json()) as { messages: Message[] }
      setInitialMessages(data.messages)
    }

    void getChats()
  }, [id])

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        html,
      },
      onResponse(response) {
        if (response.status === 401) {
          toast({
            title: response.statusText,
            variant: "destructive",
          })
        }
      },
    })

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-label="Select a project"
          className="relative justify-between"
        >
          <div className="absolute inset-1 opacity-25" />
          <BotIcon className="ml-auto h-4 w-4 shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex w-full flex-col overflow-y-scroll md:max-w-screen-2xl">
        <DialogHeader>
          <DialogTitle>Ask AI</DialogTitle>
          <DialogDescription>
            Ask anything you want to the AI about you design.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[500px] overflow-auto rounded-md border py-8">
          {messages.length ? (
            <>
              <ChatList messages={messages} />
              <ChatScrollAnchor trackVisibility={isLoading || true} />
            </>
          ) : (
            <EmptyChat setInput={setInput} />
          )}
        </ScrollArea>
        <ChatPanel
          id={id}
          isLoading={isLoading}
          stop={stop}
          append={append}
          reload={reload}
          messages={messages}
          input={input}
          setInput={setInput}
        />

        <DialogFooter>
          <Button type="submit">Introduce changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
