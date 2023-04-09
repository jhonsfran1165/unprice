import { cn } from "@/lib/utils"
import { Card } from "@/components/shared/card"

export const ProjectSkeleton = ({ isLoading }: { isLoading?: boolean }) => (
  <Card>
    <div className="flex items-center space-x-1">
      <div className="flex-1">
        <div className="flex items-center justify-start space-x-3 px-1">
          <div
            className={cn(
              "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-background-solidHover",
              {
                "animate-pulse": isLoading,
              }
            )}
          />
          <div
            className={cn("h-4 w-full rounded-lg bg-background-solidHover", {
              "animate-pulse": isLoading,
            })}
          />

          <div
            className={cn("h-4 w-10 rounded-lg bg-background-solidHover", {
              "animate-pulse": isLoading,
            })}
          />
        </div>
      </div>
    </div>
    <div className={"h-3 pb-4"}>
      <div className={"pl-4 font-semibold"}>
        {" "}
        <div
          className={cn("h-4 rounded-lg bg-background-solidHover", {
            "animate-pulse": isLoading,
          })}
        />
      </div>
    </div>
    <div className={"flex h-3 justify-end pb-4 text-right"}>
      <div
        className={cn("h-4 w-10 rounded-lg bg-background-solidHover", {
          "animate-pulse": isLoading,
        })}
      />
    </div>
  </Card>
)
