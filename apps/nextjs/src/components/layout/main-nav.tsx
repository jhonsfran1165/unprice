import { cn, focusRing } from "@builderai/ui/utils"
import { navItems } from "~/constants/layout"
import { SuperLink } from "../super-link"

export function MainNav({ ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className="hidden items-center lg:flex" {...props}>
      {navItems.map((item, idx) => (
        <SuperLink
          href={item.href}
          key={`${item.href}-${idx}`}
          className={cn(
            "rounded-md px-2 py-1.5 font-medium text-sm transition-colors hover:text-background-textContrast",
            focusRing
          )}
        >
          {item.title}
        </SuperLink>
      ))}
    </nav>
  )
}
