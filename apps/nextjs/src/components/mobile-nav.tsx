"use client"

import * as React from "react"
import Link from "next/link"

import { navItems, siteConfig } from "@builderai/config"
import { Button } from "@builderai/ui/button"
import { Logo } from "@builderai/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"
import { ScrollArea } from "@builderai/ui/scroll-area"

import Search from "~/components/search"
import ThemeToggle from "~/components/theme-toggle"

export function MobileDropdown() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Logo className="mr-2 h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-40 mt-2 h-[calc(100vh-4rem)] w-screen animate-none rounded-none border-none transition-transform">
        <Search />
        <ScrollArea className="py-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // className="mt-2 flex items-center text-lg font-semibold sm:text-sm"
              className="flex py-1 text-base font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.title}
            </Link>
          ))}
        </ScrollArea>
        <div className="border-t pt-4">
          <ThemeToggle />
        </div>
      </PopoverContent>
    </Popover>
  )
}
