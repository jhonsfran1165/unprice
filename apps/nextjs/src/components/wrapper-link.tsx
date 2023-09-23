import type { ReactNode } from "react"
import Link from "next/link"

export interface WrapperLinkProps {
  href: string
  className: string
  children: ReactNode
}

export const WrapperLink = ({
  href,
  className,
  children,
  ...props
}: WrapperLinkProps) => {
  if (href == "#") {
    return <button className={className}>{children}</button>
  }
  return (
    <Link key={href} href={href} className={className} {...props}>
      {children}
    </Link>
  )
}
