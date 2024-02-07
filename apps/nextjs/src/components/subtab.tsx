"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@builderai/ui"

export default function SubTab({
  href,
  icon,
  title,
  className,
  classNameActive,
}: {
  title: string
  href: string
  className?: string
  classNameActive?: string
  icon?: React.ReactNode
}) {
  const pathname = usePathname()
  const active = href === pathname

  return (
    <Link
      prefetch={false}
      href={`${href}`}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-2 py-1 text-sm font-medium ring-offset-background transition-all hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
        active && classNameActive
      )}
    >
      {icon}
      {title}
    </Link>
  )
}
