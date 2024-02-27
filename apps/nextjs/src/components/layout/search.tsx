"use client"

import * as React from "react"

import { Button } from "@builderai/ui/button"
import { CommandDialog } from "@builderai/ui/command"

export function Search(props: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        className="relative hidden h-8 w-full justify-start rounded-[0.5rem] border text-sm text-muted-foreground sm:pr-12 md:flex md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="top-1.3 pointer-events-none absolute right-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        {props.children}
      </CommandDialog>
    </div>
  )
}
