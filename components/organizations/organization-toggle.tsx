"use client"

import Link from "next/link"

import { useStore } from "@/lib/stores/layout"
import useOrganizations from "@/lib/swr/use-organizations"
import OrganizationLink from "@/components/organizations/organization-link"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
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
  const { orgSlug, orgData } = useStore()
  const { organizationProfiles, isLoading } = useOrganizations({
    revalidateOnFocus: true,
  })

  return (
    <div className="flex items-center justify-start space-x-2">
      <OrganizationLink isLoading={isLoading} org={orgData?.organization} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center justify-center p-1 text-base hover:bg-background-bgHover focus:bg-background-bgHover active:bg-background-bgActive"
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
          className="w-72 bg-background-bgSubtle"
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
                className="z-50 h-8 bg-background-bgHover text-sm"
                placeholder="search"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-background-line" />
            {isLoading
              ? null
              : organizationProfiles?.map(
                  (org, index) =>
                    org.org_id && (
                      <DropdownMenuItem
                        asChild
                        key={index}
                        className="cursor-pointer px-8 hover:bg-background-bgHover hover:text-background-textContrast focus:bg-background-bgHover"
                      >
                        <Link href={`/org/${org.org_slug}`} prefetch={true}>
                          <Avatar className="mr-2 h-5 w-5">
                            <AvatarImage
                              src={
                                org.org_image ||
                                `https://avatar.vercel.sh/${org.org_slug}`
                              }
                              alt={org.org_slug}
                            />
                          </Avatar>
                          <span>{org.org_slug}</span>
                          <span className="ml-2 rounded-md px-1.5 py-0.5 text-xs text-primary-solid no-underline group-hover:no-underline ">
                            {org.is_default && "default"}
                          </span>
                          {org.org_slug === orgSlug && (
                            <DropdownMenuShortcut>
                              <Icons.check className={"h-4 w-4"} />
                            </DropdownMenuShortcut>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    )
                )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-background-line" />
          <DropdownMenuGroup>
            <div className="relative flex justify-center cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm font-medium outline-none hover:text-background-textContrast">
              <Link className="m-0" href={"/org"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border w-56 border-primary-border bg-primary-bg text-primary-text hover:border-primary-borderHover hover:bg-primary-bgHover hover:text-primary-textContrast active:bg-primary-bgActive"
                >
                  <Icons.add className="h-4 w-4 rotate-0 scale-100 hover:text-background-textContrast" />
                  <span className="pl-2 text-sm">Create new Organization</span>
                </Button>
              </Link>
            </div>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
