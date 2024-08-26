"use client"

import { EmptyPlaceholder } from "~/components/empty-placeholder"

import { Button } from "@unprice/ui/button"
import { ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function ErrorOnboarding({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const router = useRouter()

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
            <Button variant="primary" onClick={() => router.back()}>
              Go back
            </Button>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
