import { LoadingAnimation } from "@unprice/ui/loading-animation"
import { cn } from "@unprice/ui/utils"

export default function LayoutLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[calc(100vh-7rem)] items-center justify-center", className)}>
      <LoadingAnimation className="size-8" />
    </div>
  )
}
