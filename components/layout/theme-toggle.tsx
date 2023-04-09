"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Icons } from "@/components/shared/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-background-bgHover active:bg-background-bgActive"
        >
          <Icons.sun className="rotate-0 scale-100 transition-all hover:text-background-textContrast dark:-rotate-90 dark:scale-0" />
          <Icons.moon className="absolute rotate-90 scale-0 transition-all hover:text-background-textContrast dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="bg-background-bgSubtle"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="hover:bg-background-bgHover 
          hover:text-background-textContrast 
          focus:bg-background-bgHover"
        >
          <Icons.sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="hover:bg-background-bgHover hover:text-background-textContrast 
          focus:bg-background-bgHover"
        >
          <Icons.moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="hover:bg-background-bgHover 
          hover:text-background-textContrast focus:bg-background-bgHover"
        >
          <Icons.laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
