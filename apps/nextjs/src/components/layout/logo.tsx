
import { cn } from "@builderai/ui"
import * as Icons from "@builderai/ui/icons"

export function Logo({ className = "" }) {
  return (
    <div className="hidden items-center justify-center space-x-2 text-primary-text md:flex">
      <Icons.Logo className={cn("h-6 w-6", className)} />
      <span
        className={cn(
          "hidden font-satoshi font-bold sm:inline-block",
          className
        )}
      >
        BuilderAI
      </span>
    </div>
  )
}
