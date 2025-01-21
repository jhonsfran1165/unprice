"use client"

import { Button } from "@unprice/ui/button"
import { Typography } from "@unprice/ui/typography"
import { useRouter } from "next/navigation"
import Balancer from "react-wrap-balancer"
import { BlurImage } from "~/components/blur-image"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string }
  reset: () => void
}) {
  const router = useRouter()

  const update = error.message.includes("not found in subscription")

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[800px] w-full space-y-10">
          <EmptyPlaceholder.Title className="p-10">
            <Typography variant="h1">Something went wrong</Typography>
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
          <EmptyPlaceholder.Description>
            <Balancer>{error.message}</Balancer>
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <div className="mt-6 flex flex-row items-center justify-center gap-10">
              {/* TODO: add update subscription button */}
              {update ? (
                <Button variant="primary" onClick={() => reset()}>
                  Update subscription
                </Button>
              ) : (
                <>
                  <Button variant="primary" onClick={() => reset()}>
                    Try again
                  </Button>
                  <Button variant="default" onClick={() => router.back()}>
                    Back
                  </Button>
                </>
              )}
            </div>
          </EmptyPlaceholder.Action>
        </EmptyPlaceholder>
      </div>
    </DashboardShell>
  )
}
