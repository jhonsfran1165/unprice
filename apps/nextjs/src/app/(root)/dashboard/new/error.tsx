"use client"

import { EmptyPlaceholder } from "~/components/empty-placeholder"

import { Button } from "@unprice/ui/button"
import { ShieldAlert } from "lucide-react"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import { SuperLink } from "~/components/super-link"

export default function ErrorOnboarding({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon>
            <ShieldAlert className="size-10" />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Title>Ups, something went wrong</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>{error.message}</EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <SuperLink href="/">
              <Button variant="primary">Dashboard</Button>
            </SuperLink>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
