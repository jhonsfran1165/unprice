import Link from "next/link"

import { cn } from "@/lib/utils"

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "z-10 w-full overflow-hidden rounded-lg border bg-background-bgSubtle p-6",
        className
      )}
      {...props}
    >
      <div className="flex flex-col justify-between space-y-4">
        <div className="space-y-2 [&>p]:text-base-text [&>h4]:!mt-0 [&>h3]:!mt-0">
          {children}
        </div>
      </div>
    </div>
  )
}
