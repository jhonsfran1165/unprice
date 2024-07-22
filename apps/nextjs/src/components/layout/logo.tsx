import { Logo as LogoIcon } from "@unprice/ui/icons"
import { cn } from "@unprice/ui/utils"
import { siteConfig } from "~/constants/layout"

export function Logo({ className = "" }) {
  return (
    <div className="flex items-center justify-start space-x-2 text-primary-text">
      <LogoIcon className={cn("size-6", className)} />
      <span
        className={cn("inline-flex whitespace-nowrap font-bold text-2xl tracking-tight", className)}
      >
        {siteConfig.name}
      </span>
    </div>
  )
}
