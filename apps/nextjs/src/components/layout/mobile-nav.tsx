"use client"

import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@builderai/ui/popover"

export function MobileDropdown({
  mobileButton,
  navTabs,
}: {
  mobileButton: React.ReactNode
  navTabs: React.ReactNode
}) {
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
      <PopoverTrigger asChild>{mobileButton}</PopoverTrigger>
      <PopoverContent className="z-40 mt-2 h-[calc(100vh-4rem)] w-screen animate-none rounded-none border-none transition-transform">
        {navTabs}
      </PopoverContent>
    </Popover>
  )
}
