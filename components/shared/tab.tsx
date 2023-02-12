"use client"

import Link from "next/link"
import {
  usePathname,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
} from "next/navigation"

import { cn } from "@/lib/utils"
import type { Item } from "@/components/shared/tab-group"

export const Tab = ({ path, item }: { path: string; item: Item }) => {
  // TODO: use this to get the segment
  const segment = useSelectedLayoutSegment()
  const segments = useSelectedLayoutSegments()
  const pathname = usePathname()
  const href = item.slug ? path + "/" + item.slug : path

  const isActive = href === pathname
  // const isActive = item.slug === segment

  // console.log(segment)
  // console.log(segments)

  return (
    <Link
      key={href}
      href={href}
      className={cn("border-b-2 p-1", {
        "border-black dark:text-white dark:border-white": isActive,
        "border-transparent text-gray-600 hover:text-black": !isActive,
      })}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-gray-100 active:bg-gray-200">
        <p className="text-sm">{item.text}</p>
      </div>
    </Link>
  )
}
