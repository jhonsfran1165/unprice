"use client"

import { useCompletion } from "ai/react"

import { useToast } from "@builderai/ui/use-toast"

export default function Completion() {
  const { toast } = useToast()
  const {
    completion,
    input,
    stop,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = useCompletion({
    api: "/api/completion",
    body: {
      id: "q25T5XY",
    },
    onResponse: (res) => {
      // trigger something when the response starts streaming in
      // e.g. if the user is rate limited, you can show a toast
      if (res.status === 429) {
        toast({
          title: "You are being rate limited. Please try again later.",

          variant: "destructive",
        })
      }
    },
    onFinish: () => {
      // do something with the completion result
      toast({
        title: "Successfully generated completion!",
        description: "You can now use the completion in your app.",
      })
    },
  })

  return (
    <div style={{ cursor: "pointer", zIndex: 100000, pointerEvents: "all" }}>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Enter your prompt..."
          onChange={handleInputChange}
        />
        <p>Completion result: {completion}</p>
        <button type="button" onClick={stop}>
          Stop
        </button>
        <button disabled={isLoading} type="submit">
          Submit
        </button>
      </form>
    </div>
  )
}
