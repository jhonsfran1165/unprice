"use client"

import { Button } from "@unprice/ui/button"
import { CheckIcon, CopyIcon } from "lucide-react"
import React from "react"

export default function CopyToClipboard({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch (error) {
      console.error("Error copying to clipboard", error)
    } finally {
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    }
  }
  return (
    <Button
      size="icon"
      variant="default"
      onClick={copyToClipboard}
      className="select-none backdrop-blur-xl"
    >
      {!copied ? (
        <CopyIcon aria-hidden="true" className="size-4" />
      ) : (
        <CheckIcon aria-hidden="true" className="size-4" />
      )}
    </Button>
  )
}
