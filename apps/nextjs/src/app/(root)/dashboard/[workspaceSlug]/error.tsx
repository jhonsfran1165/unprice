"use client"

import { Button } from "@unprice/ui/button"
import { useRouter } from "next/navigation"
import { BlurImage } from "~/components/blur-image"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function ErrorPage({
  reset,
  error,
}: {
  error: Error
  reset: () => void
}) {
  const router = useRouter()

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[800px] w-full space-y-10">
          <EmptyPlaceholder.Title className="mt-0 p-10" variant="h1">
            "Something went wrong"
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Icon>
            <BlurImage
              alt="missing site"
              src="/app-launch.svg"
              width={400}
              height={400}
              className="invert-0 filter dark:invert"
            />
          </EmptyPlaceholder.Icon>
          <EmptyPlaceholder.Description className="mx-auto w-1/3 text-center">
            {error.message}
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <div className="mt-6 flex flex-row items-center justify-center gap-2">
              <Button variant="primary" onClick={() => reset()}>
                Try again
              </Button>
              <Button variant="default" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
