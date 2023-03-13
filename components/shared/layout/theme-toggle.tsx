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
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="active:bg-background-bgActive hover:bg-background-bgHover"
        >
          {theme === "light" && (
            <Icons.sun className="hover:text-background-textContrast" />
          )}
          {theme === "dark" && (
            <Icons.moon className="hover:text-background-textContrast" />
          )}
          {theme === "system" && (
            <Icons.laptop className="hover:text-background-textContrast" />
          )}
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
          className="hover:bg-background-bgHover hover:text-background-textContrast"
        >
          <Icons.sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="hover:bg-background-bgHover hover:text-background-textContrast"
        >
          <Icons.moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="hover:bg-background-bgHover hover:text-background-textContrast"
        >
          <Icons.laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
