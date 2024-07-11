"use client"

import { cn } from "@builderai/ui/utils"
import { useEditor } from "@craftjs/core"
import type React from "react"
import { useEffect } from "react"

export const Viewport: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    enabled,
    connectors,
    actions: { setOptions },
  } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

  useEffect(() => {
    if (!window) {
      return
    }

    window.requestAnimationFrame(() => {
      // Notify doc site
      window.parent.postMessage(
        {
          LANDING_PAGE_LOADED: true,
        },
        "*"
      )

      setTimeout(() => {
        setOptions((options) => {
          options.enabled = true
        })
      }, 200)
    })
  }, [setOptions])

  return (
    <div
      className={cn("craftjs-renderer flex flex-1 flex-col overflow-y-auto transition", {
        "bg-background-base": enabled,
      })}
      ref={(ref) => {
        if (!ref) return
        connectors.select(connectors.hover(ref, ""), "")
      }}
    >
      {children}
    </div>
  )
}
