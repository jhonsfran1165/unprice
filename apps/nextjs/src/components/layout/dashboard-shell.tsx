import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@builderai/ui"
import { Badge } from "@builderai/ui/badge"

import MaxWidthWrapper from "~/components/layout/max-width-wrapper"

export function DashboardShell(props: {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  tabs?: React.ReactNode
  sidebar?: React.ReactNode
  backLink?: string
}) {
  return (
    <div
      className={cn(
        "flex h-[calc(100vh-3.5rem)] grow flex-row",
        props.className
      )}
    >
      {props.tabs && props.tabs}

      <main className="flex flex-1 flex-col space-y-12 overflow-y-auto py-8">
        {props.backLink && (
          <MaxWidthWrapper className="max-w-screen-2xl">
            <div className="flex justify-between align-middle">
              <Link
                className="flex items-center justify-start align-middle text-sm"
                prefetch={false}
                href={props.backLink}
              >
                <Badge variant={"outline"} className="py-1">
                  <ChevronLeft className="h-4 w-4" />
                  back
                </Badge>
              </Link>
            </div>
          </MaxWidthWrapper>
        )}

        {props.header && (
          <MaxWidthWrapper className="max-w-screen-2xl">
            {props.header}
          </MaxWidthWrapper>
        )}

        <MaxWidthWrapper className="flex max-w-screen-2xl flex-1 flex-col">
          {/* sidebar menu config */}
          {props.sidebar ? (
            <div className="flex flex-col gap-2 md:flex-1 md:flex-row">
              <aside className="flex flex-col md:flex md:w-1/5">
                {props.sidebar}
              </aside>
              <div className="flex flex-1 flex-col md:w-4/5">
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
