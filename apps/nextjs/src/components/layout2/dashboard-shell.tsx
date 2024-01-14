import React from "react"

import { cn } from "@builderai/ui/utils"

import MaxWidthWrapper from "~/components/max-width-wrapper"

// TODO: add dashboard skeleton
export function DashboardShell(props: {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  tabs?: React.ReactNode
  sidebar?: React.ReactNode
  sidebartabs?: React.ReactNode
  subtabs?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex h-[calc(100vh-3.5rem)] grow flex-row",
        props.className
      )}
    >
      {props.tabs && props.tabs}

      <main className="flex flex-1 flex-col overflow-y-auto border py-4">
        {props.header && props.header}

        <MaxWidthWrapper className="flex max-w-screen-2xl flex-1 flex-col">
          {/* sidebar menu config */}
          {props.sidebar && (
            <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row">
              <aside className="flex flex-col sm:flex sm:w-1/4">
                {props.sidebar}
              </aside>
              <div className="flex flex-1 flex-col sm:w-3/4">
                {props.sidebartabs && props.sidebartabs}
                <div className={cn("space-y-6", props.className)}>
                  {props.children}
                </div>
              </div>
            </div>
          )}

          {/* without sidebar menu config */}

          {!props.sidebar && (
            <div className="flex flex-1 flex-col">
              {props.subtabs && props.subtabs}
              {/* <div className={cn("grow", props.className)}> */}
              {props?.children}
              {/* </div> */}
            </div>
          )}
        </MaxWidthWrapper>
      </main>
    </div>
  )
}
