"use client"

import Link from "next/link"
import { usePathname, useSelectedLayoutSegments } from "next/navigation"

import { navBarBySlug, navBarSiteBySlug } from "@/config/dashboard"
import { cn } from "@/lib/utils"
import { Card } from "@/components/shared/card"
import { Icons } from "@/components/shared/icons"

export function DashboardNav({ items, path }) {
  return (
    <Card>
      <nav className="grid items-start gap-2">
        {items.map((item, index) => {
          const Icon = Icons[item.icon]
          return (
            <Link key={index} href={item.disabled ? path + "#" : item.href}>
              <span
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium text-base-text hover:bg-base-skin-200",
                  path === item.href ? "bg-slate-200" : "transparent",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </span>
            </Link>
          )
        })}
      </nav>
    </Card>
  )
}
