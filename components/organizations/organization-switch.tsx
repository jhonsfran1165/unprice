"use client"

import { useState } from "react"
import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import OrganizationLink from "@/components/organizations/organization-link"
import { Icons } from "@/components/shared/icons"

export function OrganizationSwitch() {
  const { orgSlug, orgData, appClaims } = useStore()
  const [open, setOpen] = useState(false)

  // rely on claims from JWT is less expensive in terms of request to the db
  // we refresh the token when we see changes in the app metadata
  const organizationProfiles = appClaims?.organizations

  return (
    <div className="flex items-center justify-start space-x-2">
      <OrganizationLink org={orgData} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-label="Select an organization"
            className="button-ghost justify-between p-1"
          >
            <Icons.chevronsupdown
              className="ml-auto h-4 w-4 shrink-0 opacity-60"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[220px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {Object.keys(organizationProfiles ?? {}).map((orgId) => {
                  const org =
                    organizationProfiles && organizationProfiles[orgId]

                  if (!org) return null

                  return (
                    <Link
                      key={orgId}
                      className="w-full"
                      href={`/org/${org.slug}`}
                      prefetch={true}
                    >
                      <CommandItem
                        className="text-sm"
                        onSelect={() => {
                          setOpen(false)
                        }}
                      >
                        <Avatar className="mr-2 h-5 w-5">
                          <AvatarImage
                            src={
                              org.image ||
                              `https://avatar.vercel.sh/${org.slug}`
                            }
                            alt={org.slug || ""}
                          />
                        </Avatar>
                        <span className="mr-2 w-1/3 truncate">{org.slug}</span>
                        {org.is_default && (
                          <Badge variant={"outline"}>default</Badge>
                        )}
                        {org.slug === orgSlug && (
                          <Icons.check
                            className={cn(
                              "ml-auto h-4 w-4",
                              org.slug === orgSlug ? "opacity-100" : "opacity-0"
                            )}
                          />
                        )}
                      </CommandItem>
                    </Link>
                  )
                })}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                  }}
                >
                  <Link className="m-0 flex" href={"/org"}>
                    <Icons.plusCircle className="mr-2 h-5 w-5" />
                    Create Organization
                  </Link>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
