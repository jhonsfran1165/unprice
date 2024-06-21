import type React from "react"

import { cn } from "@builderai/ui/utils"
import MaxWidthWrapper from "./max-width-wrapper"

export function DashboardShell(props: {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
}) {
  return (
    <MaxWidthWrapper>
      <div className={cn("flex flex-1 flex-col space-y-6 md:space-y-12 px-0 md:py-4", props.className)}>
        {props.header && props.header}

        <div className="flex flex-col">{props?.children}</div>
      </div>
    </MaxWidthWrapper>

  )
}
