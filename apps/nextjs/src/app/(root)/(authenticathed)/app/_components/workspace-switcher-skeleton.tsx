import { Avatar, AvatarFallback } from "@builderai/ui/avatar"
import { Button } from "@builderai/ui/button"
import { Skeleton } from "@builderai/ui/skeleton"

export function WorkspaceSwitcherSkeleton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      role="combobox"
      aria-label="Select a workspace"
      className="w-44 justify-between"
    >
      <Avatar className="mr-2 h-5 w-5">
        <AvatarFallback>
          <Skeleton className="bg-background-bgHover aspect-square h-full w-full" />
        </AvatarFallback>
      </Avatar>
      <Skeleton className="bg-background-bgHover h-[20px] w-full" />
      <Skeleton className="bg-background-bgHover ml-2 h-4 w-4 shrink-0" />
    </Button>
  )
}
