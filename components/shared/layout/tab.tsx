"use client"

import Link from "next/link"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { useStore } from "@/lib/stores/layout"
import { MainNavItem } from "@/lib/types/index"
import { cn } from "@/lib/utils"

export const Tab = ({ path, item }: { path: string; item: MainNavItem }) => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()
  let isActive = false

  // TODO: refactor later to support multiple modules not only site
  // this is fucking ugly thing but I need to move fast
  // If you don't like it you can go suck a dick
  if (pathname?.startsWith("/site") && segments.length > 2) {
    isActive = item.href?.split("/").includes(segments[2]) || false
  } else if (!pathname?.startsWith("/site") && segments.length == 2) {
    isActive = item.href?.split("/").includes(segments[0]) || false
  } else {
    isActive = item.href === pathname || item.href === `${pathname}/`
  }

  if (isActive) {
    useStore.setState((state) => ({
      contextHeader: item.title,
    }))
  }

  return (
    <Link
      key={item.href}
      href={item.disabled ? path : item.href}
      className={cn("border-b-2 p-1 text-secondary-700", {
        "border-primary": isActive,
        "border-transparent": !isActive,
        "cursor-not-allowed opacity-80": item.disabled,
      })}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-base-skin-200 active:bg-base-skin-900">
        <p className="text-sm">{item.title}</p>
      </div>
    </Link>
  )
}
