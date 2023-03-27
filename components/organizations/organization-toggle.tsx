"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import useOrganizations from "@/lib/swr/use-organizations"
import { Organization, OrganizationProfilesData } from "@/lib/types/supabase"
import { AddOrgModal } from "@/components/modals/add-new-organization"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function OrganizationToggle() {
  const { orgId, orgProfiles } = useStore()
  const [org, setOrg] = useState<Organization | null>()
  const { organizationProfiles } = useOrganizations({
    revalidateOnFocus: false,
    fallbackData: orgProfiles,
  })

  useEffect(() => {
    const organization = orgProfiles?.find((org) => org.org_id === orgId)
    setOrg(organization?.organization)
  }, [orgId])

  return (
    <div className="flex items-center justify-start space-x-2">
      <Link
        className="flex w-36 space-x-3 items-center justify-start hover:text-background-textContrast"
        href={`/org/${org?.id}`}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={org?.image || "https://github.com/shadcn.png"}
            alt={org?.name}
          />
          <AvatarFallback>{org?.name.substring(2)}</AvatarFallback>
        </Avatar>
        <span className="block w-full truncate text-sm font-bold text-center">
          {org?.name || "admin@builder.ai"}
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center justify-center text-base p-1 active:bg-background-bgActive focus:bg-background-bgHover hover:bg-background-bgHover"
          >
            <Icons.chevronsupdown
              className="h-4 w-4 hover:text-background-textContrast"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          forceMount
          className="bg-background-bgSubtle w-72"
        >
          <DropdownMenuLabel className="text-center">
            My Organizations
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-background-line" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="my-2">
              <Icons.search className="mr-2 h-4 w-4" />
              <Input
                onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                  e.stopPropagation()
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.stopPropagation()
                }
                type="text"
                className="text-sm z-50 h-8 bg-background-bgHover"
                placeholder="search"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-background-line" />
            {organizationProfiles?.map(
              (org, index) =>
                org.org_id && (
                  <DropdownMenuItem
                    asChild
                    key={index}
                    className="focus:bg-background-bgHover hover:bg-background-bgHover hover:text-background-textContrast px-8"
                  >
                    <Link href={`/org/${org.org_id}`}>
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={
                            org.organization?.image ||
                            "https://github.com/shadcn.png"
                          }
                          alt={org.organization.name}
                        />
                        <AvatarFallback>
                          {org.organization.name.substring(2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{org.organization.name}</span>{" "}
                      <span className="text-primary-solid ml-2 rounded-md px-1.5 py-0.5 text-xs no-underline group-hover:no-underline ">
                        {org.is_default && "default"}
                      </span>
                      {org.org_id === orgId && (
                        <DropdownMenuShortcut>
                          <Icons.check className={"w-4 h-4"} />
                        </DropdownMenuShortcut>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-background-line" />
          <DropdownMenuGroup>
            <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none hover:text-background-textContrast">
              <AddOrgModal />
            </div>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
