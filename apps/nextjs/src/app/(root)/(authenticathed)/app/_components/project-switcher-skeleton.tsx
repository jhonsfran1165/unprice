import { Button } from "@builderai/ui/button"
import { Skeleton } from "@builderai/ui/skeleton"

export function ProjectSwitcherSkeleton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      role="combobox"
      aria-label="project"
      className="w-44 justify-between opacity-50"
    >
      <Skeleton className="bg-background-bgHover h-[20px] w-full" />
      <Skeleton className="bg-background-bgHover ml-2 h-4 w-4 shrink-0" />
    </Button>
  )
}
