import { Button } from "@unprice/ui/button"
import { Skeleton } from "@unprice/ui/skeleton"

export function ProjectSwitcherSkeleton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      // biome-ignore lint/a11y/useSemanticElements: <explanation>
      role="combobox"
      aria-label="project"
      className="w-44 justify-between opacity-50"
    >
      <Skeleton className="h-[20px] w-full bg-background-bgHover" />
      <Skeleton className="ml-2 h-4 w-4 shrink-0 bg-background-bgHover" />
    </Button>
  )
}
