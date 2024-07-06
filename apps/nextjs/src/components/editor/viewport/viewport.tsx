import { Button } from "@builderai/ui/button"
import { cn } from "@builderai/ui/utils"
import { useEditor } from "@craftjs/core"
import { Redo, Undo } from "lucide-react"
import type React from "react"
import { useEffect } from "react"
import { ConfiguratorSidebar } from "./configurator-sidebar"
import { ElementsSidebar } from "./elements-sidebar"

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
    <div className={"flex flex-1 overflow-hidden"}>
      <ElementsSidebar />
      <main className="page-container flex-1 flex flex-col">
        {/* header */}
        <div className="bg-background-base h-16 sticky top-0 z-40 flex items-center px-2 backdrop-blur-[2px] border-b shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Undo className="h-5 w-5" />
              <span className="sr-only">Undo</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Redo className="h-5 w-5" />
              <span className="sr-only">Redo</span>
            </Button>
          </div>
        </div>
        <div
          className={cn("craftjs-renderer transition flex flex-col flex-1 p-8 overflow-y-auto", {
            "bg-background": enabled,
          })}
          ref={(ref) => connectors.select(connectors.hover(ref, null), null)}
        >
          <div className="flex flex-col items-center">{children}</div>
        </div>
      </main>

      <ConfiguratorSidebar />
    </div>
  )
}
