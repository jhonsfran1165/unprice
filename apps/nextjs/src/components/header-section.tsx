"use client"

import type { ActionRoute } from "@builderai/config"
import { Button } from "@builderai/ui/button"

export default function HeaderSection({
  title,
  action,
  description,
}: {
  title: string
  description?: string
  action?: ActionRoute
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="font-cal text-xl font-semibold leading-none">{title}</h1>
        <h2 className="text-base text-muted-foreground">{description}</h2>
      </div>
      {action && <Button>{action.title}</Button>}
    </div>
  )
}
