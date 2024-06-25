import { Logo as LogoIcon } from "@builderai/ui/icons"
import { cn } from "@builderai/ui/utils"

export function Logo({ className = "" }) {
  return (
    <div className="text-primary-text flex items-center justify-start space-x-4">
      <LogoIcon className={cn("size-6", className)} />
      <span
        className={cn("whitespace-nowrap text-lg font-bold tracking-tight inline-block", className)}
      >
        BuilderAI
      </span>
    </div>
  )
}
