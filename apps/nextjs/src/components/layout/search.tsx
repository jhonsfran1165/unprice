"use client"

import { CommandDialog } from "@unprice/ui/command"
import * as React from "react"

import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@unprice/ui/command"
import { CreditCard, Settings, User } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { useParams, useRouter } from "next/navigation"

export function SearchTool({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()

  const workspaceSlug = params.workspaceSlug as string

  const basepath = `/${workspaceSlug ?? ""}`

  const handleSelect = (path: string) => {
    setOpen(false)
    router.push(`${basepath}${path}`)
  }

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
    <div className={cn(className)}>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-medium font-mono text-[10px] opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => handleSelect("/settings")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/billing")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
