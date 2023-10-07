"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@builderai/ui"

export default function SubTab({
  href,
  icon,
  title,
}: {
  title?: string
  href: string
  icon?: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <Link
      href={`${href}`}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        `${href}` === pathname && "bg-background text-background-text shadow-sm"
      )}
    >
      {icon}
      {title}
    </Link>
  )
}
