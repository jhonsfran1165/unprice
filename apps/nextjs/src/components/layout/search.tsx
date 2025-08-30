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
import { Kbd } from "@unprice/ui/kbd"
import { cn } from "@unprice/ui/utils"
import { useParams, useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"

export function SearchTool({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const params = useParams()

  // handle hotkeys
  useHotkeys("meta+k", () => setOpen((open) => !open))

  const workspaceSlug = params.workspaceSlug as string

  const basepath = `/${workspaceSlug ?? ""}`

  const handleSelect = (path: string) => {
    setOpen(false)
    router.push(`${basepath}${path}`)
  }

  return (
    <div className={cn(className)}>
      <Kbd abbrTitle="K" variant="outline">
        <span className="mr-1 text-xs">⌘</span>K
      </Kbd>
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
