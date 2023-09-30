"use client"

import Link from "next/link"
import { Show } from "@legendapp/state/react"
import { AnimatePresence } from "framer-motion"

import { cn } from "@builderai/ui"

import { layoutState } from "~/stores/layout"

export function Breadcrumbs() {
  const breadcrumbs = layoutState.activeModuleTab.breadcrumbs.use()
  const activePathPrefix = layoutState.activePathPrefix.use()
  const activeSegments = layoutState.activeSegments.use()
  const activeSegmentPath = activeSegments.join("/")

  return (
    <Show if={breadcrumbs} else={null} wrap={AnimatePresence}>
      {() => (
        <div className="mb-4 inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          {Object.entries(breadcrumbs).map(([key, value]) => {
            const isActive =
              key === activeSegmentPath ||
              (key !== "" && activeSegmentPath.endsWith(key))
            return (
              <Link
                key={key}
                href={`${activePathPrefix}/${activeSegmentPath}/${key}`}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive && "bg-background text-foreground shadow-sm"
                )}
              >
                {value}
              </Link>
            )
          })}
        </div>
      )}
    </Show>
  )
}
