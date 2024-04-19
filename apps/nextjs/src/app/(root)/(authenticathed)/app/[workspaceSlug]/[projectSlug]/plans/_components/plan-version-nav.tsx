"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@builderai/ui"
import { ScrollArea, ScrollBar } from "@builderai/ui/scroll-area"

const routes = [
  {
    name: "Overview",
    href: "/",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
  },
  {
    name: "Preview Page",
    href: "/preview",
  },
]

type NavVersionPlanProps = {
  baseUrl: string
} & React.HTMLAttributes<HTMLDivElement>

export function NavVersionPlan({
  className,
  baseUrl,
  ...props
}: NavVersionPlanProps) {
  const pathname = usePathname()

  return (
    <div className="relative">
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <div
          className={cn("mb-4 flex items-center space-x-1", className)}
          {...props}
        >
          {routes.map((example, index) => (
            <Link
              href={`${baseUrl}${example.href}`}
              key={`${baseUrl}${example.href}`}
              className={cn(
                "flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition-colors hover:text-background-textContrast",
                pathname === `${baseUrl}${example.href}` ||
                  (index === 0 && pathname === baseUrl)
                  ? "bg-muted font-medium text-background-textContrast"
                  : "text-muted-foreground"
              )}
            >
              {example.name}
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
