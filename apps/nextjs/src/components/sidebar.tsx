"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Show } from "@legendapp/state/react"
import { AnimatePresence } from "framer-motion"

import { cn } from "@builderai/ui"

import { useCanRender } from "~/lib/use-can-render"
import { layoutState } from "~/stores/layout"

export default function SidebarNav() {
  const path = usePathname()
  const canRender = useCanRender()

  const items = layoutState.activeModuleTab.sidebarNav.use()
  const activePathPrefix = layoutState.activePathPrefix.use()

  return (
    <Show
      if={canRender && items?.length > 0}
      else={null}
      wrap={AnimatePresence}
    >
      {() => (
        <aside className="flex-col sm:flex sm:w-[250px]">
          <nav className="grid items-start gap-2">
            {items.map((item, index) => {
              const fullPath = activePathPrefix + item.href
              const active = fullPath === path

              return (
                item.href && (
                  <Link
                    key={index}
                    href={item.disabled ? "#" : fullPath}
                    aria-disabled={item.disabled}
                  >
                    <span
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:border-background-borderHover hover:bg-background-bg hover:text-background-textContrast active:bg-background-bgActive",
                        {
                          transparent: !active,
                          "bg-background-bgSubtle": active,
                          "cursor-not-allowed opacity-80": item.disabled,
                        }
                      )}
                    >
                      {item.icon}
                      <span
                        className={cn({
                          "text-background-textContrast": active,
                        })}
                      >
                        {item.title}
                      </span>
                    </span>
                  </Link>
                )
              )
            })}
          </nav>
        </aside>
      )}
    </Show>
  )
}
