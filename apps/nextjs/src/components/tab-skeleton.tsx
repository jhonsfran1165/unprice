import { Skeleton } from "@builderai/ui/skeleton"

export function TabSkeleton() {
  return (
    <div className={"border-b-2 border-transparent p-1"}>
      <div className="button-ghost rounded-md px-3 py-2 transition-all duration-200">
        <div className="whitespace-nowrap text-sm text-background-text hover:text-background-textContrast">
          <Skeleton className="h-[18px] w-[70px]" />
        </div>
      </div>
    </div>
  )
}
