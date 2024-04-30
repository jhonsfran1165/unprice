import React from "react"

import { cn } from "@builderai/ui"

import MaxWidthWrapper from "~/components/layout/max-width-wrapper"

export function DashboardShell(props: {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  tabs?: React.ReactNode
  sidebar?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex h-[calc(100vh-3.5rem)] grow flex-row",
        props.className
      )}
    >
      {props.tabs && props.tabs}

      <main className="flex flex-1 flex-col space-y-8 overflow-y-auto py-8">
        {props.header && (
          <MaxWidthWrapper className="max-w-screen-2xl">
            {props.header}
          </MaxWidthWrapper>
        )}

        <MaxWidthWrapper className="flex max-w-screen-2xl flex-1 flex-col">
          {/* sidebar menu config */}
          {props.sidebar ? (
            <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row">
              <aside className="flex flex-col sm:flex sm:w-1/4">
                {props.sidebar}
              </aside>
              <div className="flex flex-1 flex-col sm:w-3/4">
                <div className={cn("space-y-6", props.className)}>
                  {props.children}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">{props?.children}</div>
          )}
        </MaxWidthWrapper>
      </main>
    </div>
  )
}
