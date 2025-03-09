import type { ReactNode } from "react"

import { cn } from "@unprice/ui/utils"

export default function MaxWidthWrapper({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("container mx-auto w-full max-w-screen-2xl py-4", className)}>
      {children}
    </div>
  )
}
