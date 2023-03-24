import { cn } from "@/lib/utils"
import { Card } from "@/components/shared/card"

export const SiteSkeleton = ({ isLoading }: { isLoading?: boolean }) => (
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
      <div className={"font-semibold pl-4"}>
        {" "}
        <div
          className={cn("h-4 rounded-lg bg-background-solidHover", {
            "animate-pulse": isLoading,
          })}
        />
      </div>
    </div>
    <div className={"h-3 text-right pb-4 flex justify-end"}>
      <div
        className={cn("h-4 w-10 rounded-lg bg-background-solidHover", {
          "animate-pulse": isLoading,
        })}
      />
    </div>
  </Card>
)
