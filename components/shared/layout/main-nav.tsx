"use client"

import * as React from "react"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import useSite from "@/lib/swr/use-sites"
import { NavItem } from "@/lib/types"
import { Icons } from "@/components/shared/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  // TODO: separate site selector so we can render the navbar from server
  const { sites } = useSite({ revalidateOnFocus: false })

  return (
    <div className="flex items-center justify-start ">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <Icons.divider className="hidden mx-2 h-8 w-8 text-gray-200 gap-0 md:inline-block" />

      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center space-x-1">
            <Link href="/">
              <div className="flex items-center justify-start space-x-3 px-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span className="block truncate text-sm font-bold text-base-text-200">
                  jhonsfran@gmail.com
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              className="flex items-center justify-center text-base p-2"
            >
              <span className="flex pointer-events-none items-center justify-center">
                <Icons.chevronsupdown
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent align={"start"} className="p-0 bg-black">
          <div className="flex flex-col">
            <div className="pl-4 pt-2">
              <h4 className="text-sm font-semibold">My Sites</h4>
              <p className="text-xs text-base-skin-200">Personal Account</p>
            </div>
            <Separator className="my-2" />
            <div className="flex flex-col pb-2">
              {sites?.map(
                (site, index) =>
                  site.id && (
                    <Link
                      key={index}
                      href={`/site/${site.id}`}
                      className="pl-4 py-2 hover:bg-base-skin-200"
                    >
                      <div className="flex items-start space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              site.logo ||
                              `https://www.google.com/s2/favicons?sz=64&domain_url=${
                                site.custom_domain || site.subdomain
                              }`
                            }
                            alt={site.custom_domain || site.subdomain}
                          />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <span className="block truncate text-sm font-bold text-gray-600">
                          {site.name}
                        </span>
                      </div>
                    </Link>
                  )
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* TODO: use this for the right side of the navidation */}
      {/* only show menu when is home -> for dashboard we want to show project selector
      {pathname ? (
        <>
          <div className="flex gap-10 md:gap-10">
            {items?.length ? (
              <nav className="hidden gap-6 md:flex">
                {items?.map(
                  (item, index) =>
                    item.href && (
                      <Link
                        key={index}
                        href={item.href}
                        className={cn(
                          "flex items-center text-lg font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-100 sm:text-sm",
                          item.disabled && "cursor-not-allowed opacity-80"
                        )}
                      >
                        {item.title}
                      </Link>
                    )
                )}
              </nav>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="-ml-4 text-base hover:bg-transparent focus:ring-0 md:hidden"
              >
                <Icons.logo className="mr-2 h-4 w-4" />{" "}
                <span className="font-bold">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={24}
              className="w-[300px] overflow-scroll"
            >
              <DropdownMenuLabel>
                <Link href="/" className="flex items-center">
                  <Icons.logo className="mr-2 h-4 w-4" /> {siteConfig.name}
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items?.map(
                (item, index) =>
                  item.href && (
                    <DropdownMenuItem key={index} asChild>
                      <Link href={item.href}>{item.title}</Link>
                    </DropdownMenuItem>
                  )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-center text-base sm:px-0 px-2 py-0"
            >
              <div className="flex items-center justify-start space-x-3">
                <BlurImage
                  src={`https://www.google.com/s2/favicons?sz=64&domain_url=google.com`}
                  alt={"google"}
                  className="h-6 w-6 overflow-hidden rounded-full sm:h-8 sm:w-8"
                  width={40}
                  height={40}
                />
                <span className="block truncate text-sm font-bold text-gray-600">
                  jhonsfran@gmail.com
                </span>
              </div>
              <span className="flex pointer-events-none items-center justify-center pl-2 sm:pl-3">
                <Icons.chevronsupdown
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={10}
            className="w-[300px] overflow-scroll"
          >
            <DropdownMenuLabel>
              <Link href="/" className="flex items-center">
                <Icons.logo className="mr-2 h-4 w-4" /> {siteConfig.name}
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items?.map(
              (item, index) =>
                item.href && (
                  <DropdownMenuItem key={index} asChild>
                    <Link href={item.href}>{item.title}</Link>
                  </DropdownMenuItem>
                )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )} */}
    </div>
  )
}
