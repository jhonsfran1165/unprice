"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/shared/icons"
import { WrapperLink } from "@/components/shared/wrapper-link"

export function DashboardSideBarNav({ items, pathPrefix }) {
  const pathName = usePathname()

  if (items?.length === 0) return null

  return (
    <nav className="grid items-start gap-2">
      {items?.map((item, index) => {
        const Icon = Icons[item.icon]
        return (
          <WrapperLink
            className={""}
            key={index}
            href={item.disabled ? "#" : pathPrefix + item.href}
          >
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-background-bgHover hover:text-background-textContrast active:bg-background-bgActive",
                pathName === item.href || pathName === pathPrefix + item.href
                  ? "text-background-textContrast"
                  : "transparent",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              <Icon className="mr-2 h-4 w-4 text-primary-solid" />
              <span>{item.title}</span>
            </span>
          </WrapperLink>
        )
      })}
    </nav>
  )
}
