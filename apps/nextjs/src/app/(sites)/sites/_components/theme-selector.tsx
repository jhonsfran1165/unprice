"use client"

import { Check } from "lucide-react"
import { useState } from "react"

import { Button } from "@unprice/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@unprice/ui/dropdown-menu"

type Theme = "default" | "blue" | "purple" | "green" | "amber" | "rose"

interface ThemeSelectorProps {
  onThemeChange: (theme: Theme) => void
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<Theme>("default")

  const themes: { value: Theme; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "blue", label: "Blue" },
    { value: "purple", label: "Purple" },
    { value: "green", label: "Green" },
    { value: "amber", label: "Amber" },
    { value: "rose", label: "Rose" },
  ]

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    onThemeChange(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          {themes.find((t) => t.value === theme)?.label || "Select theme"}
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => handleThemeChange(item.value)}
            className="flex cursor-pointer items-center justify-between"
          >
            {item.label}
            {theme === item.value && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
