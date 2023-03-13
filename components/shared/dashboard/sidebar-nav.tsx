"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Card } from "@/components/shared/card"
import { Icons } from "@/components/shared/icons"

export function DashboardSideBarNav({ items, path }) {
  const pathName = usePathname()
  return (
    <Card>
      <nav className="grid items-start gap-2">
        {items.map((item, index) => {
          const Icon = Icons[item.icon]
          return (
            <Link key={index} href={item.disabled ? path + "#" : item.href}>
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-background-bgHover hover:text-background-textContrast active:bg-background-bgActive",
                  pathName === item.href
                    ? "bg-background-bg text-background-textContrast"
                    : "transparent",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <Icon className="mr-2 h-4 w-4 text-primary-solid" />
                <span>{item.title}</span>
              </span>
            </Link>
          )
        })}
      </nav>
    </Card>
  )
}
