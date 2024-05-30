import { Box, Combine, Target } from "lucide-react"

import { cn } from "@builderai/ui"
import { Separator } from "@builderai/ui/separator"

import { SuperLink } from "~/components/super-link"

export default function Stepper({
  className,
  step,
  baseUrl,
}: {
  className?: string
  step: string
  baseUrl: string
}) {
  return (
    <div className={className}>
      <div className="flex flex-col px-2 py-2 sm:px-4">
        <div className="space-y-4">
          <SuperLink
            href={`${baseUrl}`}
            className={cn("flex flex-row items-center gap-2 text-xs", {
              "text-primary-text": ["overview", "addons", "review"].includes(
                step
              ),
            })}
          >
            <Combine className="h-5 w-5" />
            <span className="hidden sm:inline">Features</span>
          </SuperLink>
          <Separator
            className={cn("mx-2 h-6", {
              "bg-primary-text": ["addons", "review"].includes(step),
            })}
            orientation="vertical"
          />
          <SuperLink
            href={`${baseUrl}/addons`}
            className={cn("flex flex-row items-center gap-2 text-xs", {
              "text-primary-text": ["addons", "review"].includes(step),
              "hover:text-background-textContrast": step !== "addons",
            })}
          >
            <Box className="h-5 w-5" />
            <span className="hidden sm:inline">Addons</span>
          </SuperLink>
          <Separator
            className={cn("mx-2 h-6", {
              "bg-primary-text": step === "review",
            })}
            orientation="vertical"
          />
          <SuperLink
            href={`${baseUrl}/review`}
            className={cn("flex flex-row items-center gap-2 text-xs", {
              "text-primary-text": ["review"].includes(step),
              "hover:text-background-textContrast": step !== "review",
            })}
          >
            <Target className="h-5 w-5" />
            <span className="hidden sm:inline">Review</span>
          </SuperLink>
        </div>
      </div>
    </div>
  )
}
