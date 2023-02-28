"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MainNavItem } from "@/lib/types/index"
import { cn } from "@/lib/utils"

export const Tab = ({ path, item }: { path: string; item: MainNavItem }) => {
  const pathname = usePathname()
  const href = path === "" ? item.href : path + item.href
  // TODO: handle the / route
  const isActive =
    pathname.startsWith(`${path}${item.href}`) ||
    `${pathname}/`.startsWith(`${path}${item.href}`)

  return (
    <Link
      key={href}
      href={item.disabled ? "#" : href}
      className={cn(
        "border-b-2 p-1 text-secondary-700 hover:text-primary-700",
        {
          "border-primary": isActive,
          "border-transparent": !isActive,
          "cursor-not-allowed opacity-80": item.disabled,
        }
      )}
    >
      <div className="rounded-md px-3 py-2 transition-all duration-75 hover:bg-primary-200 active:bg-secondary-200">
        <p className="text-sm">{item.title}</p>
      </div>
    </Link>
  )
}
