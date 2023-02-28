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
        "group relative rounded-lg border bg-base-skin p-6 text-base-text shadow-md transition-shadow hover:shadow-lg border-base-skin-200",
        className
      )}
      {...props}
    >
      <div className="flex flex-col justify-between space-y-4">
        <div className="space-y-2 [&>p]:text-slate-600 [&>p]:dark:text-slate-300 [&>h4]:!mt-0 [&>h3]:!mt-0">
          {children}
        </div>
      </div>
    </div>
  )
}
