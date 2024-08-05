"use client"

import * as React from "react"

import { CopyDone } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { Copy } from "lucide-react"

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
  src?: string
}

async function copyToClipboardWithMeta(value: string, _meta?: Record<string, unknown>) {
  navigator.clipboard.writeText(value)
}

export function CopyButton({ value, className, src, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <button
      type="button"
      className={cn("relative size-5 p-1", className)}
      onClick={() => {
        copyToClipboardWithMeta(value, {
          component: src,
        })
        setHasCopied(true)
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CopyDone className="size-4" /> : <Copy className="size-4" />}
    </button>
  )
}
