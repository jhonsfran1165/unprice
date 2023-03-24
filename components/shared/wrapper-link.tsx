import Link from "next/link"

export const WrapperLink = ({ href, className, children, ...props }) => {
  if (href == "#") {
    return <button className={className}>{children}</button>
  }
  return (
    <Link key={href} href={href} className={className} {...props}>
      {children}
    </Link>
  )
}
