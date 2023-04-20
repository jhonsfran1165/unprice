"use client"

import { useState } from "react"
import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import useOrganizations from "@/lib/swr/use-organizations"
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
  const { orgSlug, orgData } = useStore()
  const [open, setOpen] = useState(false)
  const { organizationProfiles } = useOrganizations({
    revalidateOnFocus: true,
  })

  return (
    <div className="flex items-center justify-start space-x-2">
      <OrganizationLink org={orgData?.organization} />
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
                {organizationProfiles?.map((org) => (
                  <CommandItem
                    key={org.org_id}
                    className="text-sm"
                    onSelect={() => {
                      setOpen(false)
                    }}
                  >
                    <Link
                      className="flex w-full"
                      href={`/org/${org.org_slug}`}
                      prefetch={true}
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={
                            org.org_image ||
                            `https://avatar.vercel.sh/${org.org_slug}`
                          }
                          alt={org.org_slug || ""}
                        />
                      </Avatar>
                      <span className="mr-2">{org.org_slug}</span>
                      {org.is_default && (
                        <Badge variant={"outline"}>default</Badge>
                      )}
                      {org.org_slug === orgSlug && (
                        <Icons.check
                          className={cn(
                            "ml-auto h-4 w-4",
                            org.org_slug === orgSlug
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      )}
                    </Link>
                  </CommandItem>
                ))}
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
                    Create Team
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
