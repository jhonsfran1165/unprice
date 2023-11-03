import Link from "next/link"

import { cn } from "@builderai/ui/utils"

export default function SubTab({
  href,
  icon,
  title,
  className,
  classNameActive,
  active,
}: {
  title: string
  href: string
  className?: string
  active: boolean
  classNameActive?: string
  icon?: React.ReactNode
}) {
  return (
    <Link
      href={`${href}`}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:text-background-textContrast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
        active && classNameActive
      )}
    >
      {icon}
      {title}
    </Link>
  )
}
