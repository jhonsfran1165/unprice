"use client"

import { cn, focusRing } from "@builderai/ui/utils"

import { usePathname } from "next/navigation"
import { Ping } from "~/components/ping"
import { SuperLink } from "../super-link"

export function Tab({
  disabled,
  isNew,
  href,
  children,
}: {
  disabled?: boolean
  isNew?: boolean
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (itemHref: string) => {
    // delete last slash for comparison
    const path = pathname.replace(/\/$/, "")
    const href = itemHref.replace(/\/$/, "")
    return path === href || ["", "/"].includes(path) && path.startsWith(href)
  }

  return (
    <SuperLink
      className={cn("flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200 hover:text-background-textContrast",
        focusRing, {
        "cursor-not-allowed opacity-80": disabled,
        "bg-background-bgHover text-background-textContrast": isActive(href),
        transparent: !isActive(href),
      })}
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      prefetch={false}
    >
      {children}

      <div className="relative w-1 h-5">
        {isNew && (
          <div className="absolute right-1 top-1">
            <Ping />
          </div>
        )}
      </div>
    </SuperLink>
  )
}


export function ShortLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (itemHref: string) => {
    return pathname === itemHref
  }

  return (
    <SuperLink
      href={href}
      className={cn("flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition",
        focusRing, {
        "bg-background-bgHover text-background-textContrast": isActive(href),
        "hover:text-background-textContrast": !isActive(href),
      })}
    >
      {children}
    </SuperLink>
  )
}

