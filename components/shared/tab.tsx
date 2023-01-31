"use client"

import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Item } from "@/components/shared/tab-group"

export const Tab = ({ path, item }: { path: string; item: Item }) => {
  const segment = useSelectedLayoutSegment()
  const href = item.slug ? path + "/" + item.slug : path
  const isActive =
    // Example home pages e.g. `/layouts`
    (!item.slug && segment === null) ||
    segment === item.segment ||
    // Nested pages e.g. `/layouts/electronics`
    segment === item.slug

  return (
    <Link
      href={href}
      className={cn("rounded-lg px-3 py-1 text-sm font-medium", {
        "rounded-md px-3 py-2 transition-all duration-75 hover:bg-gray-100 active:bg-gray-200":
          !isActive,
        "bg-vercel-blue text-white": isActive,
      })}
    >
      {item.text}
    </Link>
  )
}
