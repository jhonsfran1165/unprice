"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { SubTabsRoutes } from "@builderai/config/types"
import { createIcon } from "@builderai/config/types"
import { cn } from "@builderai/ui"
import { buttonVariants } from "@builderai/ui/button"

export default function MenuSubTabs({
  basePath,
  activeSubTabs,
  className,
}: {
  basePath?: string
  activeSubTabs?: SubTabsRoutes
  className?: string
}) {
  const pathname = usePathname()

  if (!activeSubTabs) return null

  return (
    <div className={cn("mb-15 group flex flex-row space-x-2 py-2", className)}>
      {Object.entries(activeSubTabs).map(([index, item]) => {
        const Icon = item?.icon && createIcon(item?.icon)
        const href = `${basePath}/${index}`
        const active = href === pathname

        return (
          <Link
            key={index}
            href={href}
            className={cn(
              buttonVariants({
                variant: active ? "outline" : "ghost",
                size: "sm",
              }),
              {
                "bg-background-bgHover text-background-text": active,
              }
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            <span className={"ml-auto"}>{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
