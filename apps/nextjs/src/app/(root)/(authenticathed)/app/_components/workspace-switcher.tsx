"use client"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

import type { RouterOutputs } from "@builderai/api"
import { Avatar, AvatarFallback, AvatarImage } from "@builderai/ui/avatar"
import { Badge } from "@builderai/ui/badge"
import { Button } from "@builderai/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@builderai/ui/command"
import { Dialog, DialogTrigger } from "@builderai/ui/dialog"
import { Check, ChevronsUpDown, PlusCircle } from "@builderai/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { cn } from "@builderai/ui/utils"
import NewTeamDialog from "./new-workspace"
import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton"

export function WorkspaceSwitcher({
  workspacesPromise,
  workspaceSlug,
}: {
  workspaceSlug: string
  workspacesPromise: Promise<RouterOutputs["workspaces"]["listWorkspaces"]>
}) {
  const router = useRouter()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false)

  const { workspaces } = use(workspacesPromise)

  const activeWorkspace = workspaces.find((workspace) => workspace.slug === workspaceSlug)

  const personalWorkspace = workspaces.find((wk) => wk.isPersonal)
  const teams = workspaces.filter((wk) => !wk.isPersonal)

  if (!activeWorkspace) {
    return <WorkspaceSwitcherSkeleton />
  }

  return (
    <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
      <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={switcherOpen}
            aria-label="Select a workspace"
            className="w-24 sm:w-full"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={
                  activeWorkspace.imageUrl && activeWorkspace.imageUrl !== ""
                    ? activeWorkspace.imageUrl
                    : `https://avatar.vercel.sh/${activeWorkspace.id}`
                }
                alt={`user-${activeWorkspace.name}`}
              />
              <AvatarFallback>{activeWorkspace.slug?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-semibold">
              {activeWorkspace.name}
              <Badge className={"ml-2"}>
                {activeWorkspace.isInternal ? "pro - internal" : "pro"}
              </Badge>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search workspace..." />
              {personalWorkspace && (
                <CommandGroup heading="Personal workspace">
                  <CommandItem
                    onSelect={() => {
                      setSwitcherOpen(false)
                      router.push(`/${personalWorkspace.slug}`)
                    }}
                    className={cn(
                      "cursor-pointer font-semibold text-sm",
                      activeWorkspace.id === personalWorkspace.id
                        ? "bg-background-bgActive"
                        : "bg-transparent"
                    )}
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={
                          personalWorkspace.imageUrl && personalWorkspace.imageUrl !== ""
                            ? personalWorkspace.imageUrl
                            : `https://avatar.vercel.sh/${personalWorkspace.id}`
                        }
                        alt={`user-${personalWorkspace.name}`}
                      />
                      <AvatarFallback>{personalWorkspace.slug?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="z-10 truncate font-semibold">{personalWorkspace.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        activeWorkspace.id === personalWorkspace.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                </CommandGroup>
              )}

              {teams.length !== 0 && (
                <CommandGroup heading="Teams">
                  {teams?.map((workspace) => (
                    <CommandItem
                      key={workspace.name}
                      onSelect={() => {
                        setSwitcherOpen(false)
                        router.push(`/${workspace.slug}`)
                      }}
                      className={cn(
                        "cursor-pointer font-semibold text-sm",
                        activeWorkspace?.id === workspace.id
                          ? "bg-background-bgActive"
                          : "bg-transparent"
                      )}
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={
                            workspace.imageUrl && workspace.imageUrl !== ""
                              ? workspace.imageUrl
                              : `https://avatar.vercel.sh/${workspace.id}`
                          }
                          alt={`user-${workspace.name}`}
                        />
                        <AvatarFallback>{workspace.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="z-10 truncate font-semibold">{workspace.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          activeWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setSwitcherOpen(false)
                      setNewOrgDialogOpen(true)
                    }}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Team
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <NewTeamDialog closeDialog={() => setNewOrgDialogOpen(false)} isOpen={newOrgDialogOpen} />
    </Dialog>
  )
}
