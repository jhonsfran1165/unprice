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
    <div className={"min-h-screen w-full"}>
      <ElementsSidebar />
      <div className="page-container flex flex-col flex-1 pr-64 pl-64 xl:pl-72 xl:pr-72 min-h-screen">
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
          className={cn("craftjs-renderer transition flex-1 p-4 overflow-y-auto", {
            "bg-background": enabled,
          })}
          ref={(ref) => connectors.select(connectors.hover(ref, null), null)}
        >
          <div className="flex flex-col">{children}</div>
        </div>
      </div>

      <ConfiguratorSidebar />
    </div>
  )
}
