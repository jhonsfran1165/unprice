import { layoutConfig } from "@/lib/config/layout"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/shared/icons"

export function Logo({ className = "" }) {
  return (
    <div className="hidden md:flex items-center justify-center space-x-2 text-primary-text">
      <Icons.logo className={cn("h-6 w-6", className)} />
      <span
        className={cn(
          "hidden font-bold sm:inline-block font-satoshi",
          className
        )}
      >
        {layoutConfig.name}
      </span>
    </div>
  )
}
