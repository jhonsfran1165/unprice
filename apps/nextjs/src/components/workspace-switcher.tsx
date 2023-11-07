"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

import { useOrganization, useOrganizationList, useUser } from "@builderai/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@builderai/ui/avatar"
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

import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton"

const NewOrganizationDialog = dynamic(() => import("./new-workspace"))

export function WorkspaceSwitcher() {
  const router = useRouter()

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false)

  const { user, isSignedIn, isLoaded } = useUser()
  const orgs = useOrganizationList()
  const org = useOrganization()

  if (isLoaded && !isSignedIn) throw new Error("How did you get here???")

  const activeOrg = org.organization ?? user

  if (!orgs.isLoaded || !org.isLoaded || !activeOrg) {
    // Skeleton loader
    return <WorkspaceSwitcherSkeleton />
  }

  const normalizedObject = {
    id: activeOrg.id,
    name:
      "name" in activeOrg
        ? activeOrg.name
        : "username" in activeOrg
        ? activeOrg.username
        : "",
    image: activeOrg.imageUrl,
  }

  return (
    <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
      <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={switcherOpen}
            aria-label="Select a workspace"
            className="w-40 justify-between md:w-44"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage src={normalizedObject?.image ?? ""} />
              <AvatarFallback>
                {normalizedObject.name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="z-10 font-semibold">{normalizedObject.name}</span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search workspace..." />
              <CommandGroup heading="Personal account">
                <CommandItem
                  onSelect={async () => {
                    if (!user?.id) return
                    normalizedObject.id = user.id ?? ""

                    await orgs.setActive?.({ organization: null })
                    setSwitcherOpen(false)
                    router.push(`/${user.username}/overview`)
                  }}
                  className={cn(
                    "cursor-pointer text-sm font-semibold",
                    org.organization === null
                      ? "bg-background-bgActive"
                      : "bg-transparent"
                  )}
                >
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName ?? ""}
                    />
                    <AvatarFallback>
                      {`${user?.firstName?.[0]}${user?.lastName?.[0]}` ?? "JD"}
                    </AvatarFallback>
                  </Avatar>
                  {user?.username}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      org.organization === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Organizations">
                {orgs.organizationList?.map(({ organization: org }) => (
                  <CommandItem
                    key={org.name}
                    onSelect={async () => {
                      await orgs.setActive({ organization: org })
                      setSwitcherOpen(false)
                      router.push(`/${org.slug}/overview`)
                    }}
                    className={cn(
                      "cursor-pointer text-sm font-semibold",
                      normalizedObject?.id === org.id
                        ? "bg-background-bgActive"
                        : "bg-transparent"
                    )}
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={org.imageUrl ?? "/images/placeholder.png"}
                        alt={org.name}
                      />
                      <AvatarFallback>
                        {org.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {org.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        normalizedObject?.id === org.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
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
                    Create Organization
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Suspense>
        <NewOrganizationDialog closeDialog={() => setNewOrgDialogOpen(false)} />
      </Suspense>
    </Dialog>
  )
}
