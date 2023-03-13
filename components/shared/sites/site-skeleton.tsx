import { cn } from "@/lib/utils"

export const SiteSkeleton = ({ isLoading }: { isLoading?: boolean }) => (
  <div
    className={cn("rounded-2xl border bg-base-bg-dark p-4", {
      "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent":
        isLoading,
    })}
  >
    <div className="space-y-3">
      <div
        className={cn("h-14 rounded-lg bg-gray-700", {
          "animate-pulse": isLoading,
        })}
      />
      <div
        className={cn("h-3 w-11/12 rounded-lg bg-gray-700", {
          "animate-pulse": isLoading,
        })}
      />
      <div
        className={cn("h-3 w-8/12 rounded-lg bg-gray-700", {
          "animate-pulse": isLoading,
        })}
      />
    </div>
  </div>
)
