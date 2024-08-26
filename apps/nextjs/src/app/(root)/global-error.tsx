"use client"

import { Button } from "@unprice/ui/button"
import { ShieldAlert } from "lucide-react"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <DashboardShell>
          <div className="flex flex-col items-center justify-center">
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon>
                <ShieldAlert className="size-10" />
              </EmptyPlaceholder.Icon>
              <EmptyPlaceholder.Title>Something went wrong!</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>Please try again later.</EmptyPlaceholder.Description>
              <EmptyPlaceholder.Action>
                <Button variant="primary" onClick={() => reset()}>
                  Try again
                </Button>
              </EmptyPlaceholder.Action>
            </EmptyPlaceholder>
          </div>
        </DashboardShell>
      </body>
    </html>
  )
}
