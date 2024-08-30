"use client"
import { Progress } from "@unprice/ui/progress"
import { cn } from "@unprice/ui/utils"

export function ProgressBar({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) {
  const progress = (value / max) * 100

  return <Progress value={progress} className={cn("h-2 w-full", className)} />
}
