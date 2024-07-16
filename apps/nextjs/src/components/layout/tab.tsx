"use client"

import { cn, focusRing } from "@builderai/ui/utils"

import { usePathname } from "next/navigation"
import { Ping } from "~/components/ping"
import { SuperLink } from "../super-link"

export function Tab({
  disabled,
  isNew,
  href,
  baseUrl,
  children,
  isSubmenu,
}: {
  disabled?: boolean
  isNew?: boolean
  href: string
  baseUrl: string
  isSubmenu?: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (itemHref: string) => {
    // delete last slash for comparison
    const path = pathname.replace(baseUrl, "")
    const href = itemHref.replace(/\/$/, "")

    return path === href || (path.startsWith(href) && !["", "/"].includes(href))
  }

  return (
    <SuperLink
      className={cn(
        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium text-sm transition-all duration-200 hover:text-background-textContrast",
        focusRing,
        {
          "cursor-not-allowed opacity-80": disabled,
          "bg-background-bgHover": isActive(href) && !isSubmenu,
          "text-background-textContrast": isActive(href) && isSubmenu,
          transparent: !isActive(href),
        }
      )}
      href={disabled ? "#" : baseUrl + href}
      aria-disabled={disabled}
      prefetch={false}
    >
      {children}

      <div className="relative h-5 w-1">
        {isNew && (
          <div className="absolute top-1 right-1">
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
      className={cn(
        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium text-sm transition",
        focusRing,
        {
          "bg-background-bgHover text-background-textContrast": isActive(href),
          "hover:text-background-textContrast": !isActive(href),
        }
      )}
    >
      {children}
    </SuperLink>
  )
}
