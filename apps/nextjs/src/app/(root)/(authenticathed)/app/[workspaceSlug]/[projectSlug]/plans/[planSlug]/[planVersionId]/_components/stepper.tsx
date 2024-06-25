"use client"

import { Combine, Target } from "lucide-react"
import { usePathname } from "next/navigation"

import { Separator } from "@builderai/ui/separator"
import { cn, focusRing } from "@builderai/ui/utils"

import { SuperLink } from "~/components/super-link"

export default function Stepper({
  className,
  baseUrl,
  planVersionId,
}: {
  className?: string
  baseUrl: string
  planVersionId: string
}) {
  let step = usePathname().split("/").pop() ?? "overview"

  if (step === planVersionId) {
    step = "overview"
  }

  return (
    <div className={className}>
      <div className="flex flex-row items-center gap-4">
        <SuperLink
          href={`${baseUrl}`}
          className={cn(
            "flex flex-row items-center gap-2 text-xs",
            {
              "text-primary-text": ["overview", "review"].includes(step),
            },
            focusRing
          )}
        >
          <Combine className="h-5 w-5" />
          <span className="hidden sm:inline">Features</span>
        </SuperLink>
        <Separator
          className={cn("mx-2 w-6", {
            "bg-primary-text": ["review"].includes(step),
          })}
          orientation="horizontal"
        />
        <SuperLink
          href={`${baseUrl}/review`}
          className={cn(
            "flex flex-row items-center gap-2 text-xs",
            {
              "text-primary-text": ["review"].includes(step),
              "hover:text-background-textContrast": step !== "review",
            },
            focusRing
          )}
        >
          <Target className="h-5 w-5" />
          <span className="hidden sm:inline">Review</span>
        </SuperLink>
      </div>
    </div>
  )
}
