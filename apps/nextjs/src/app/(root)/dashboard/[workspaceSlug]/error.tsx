"use client"
import { Button } from "@unprice/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Balancer from "react-wrap-balancer"
import { BlurImage } from "~/components/blur-image"
import { EmptyPlaceholder } from "~/components/empty-placeholder"
import { DashboardShell } from "~/components/layout/dashboard-shell"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState("An unknown error occurred")
  const [errorCode, setErrorCode] = useState("Something went wrong")
  const [updateSubscription, setUpdateSubscription] = useState(false)

  useEffect(() => {
    try {
      const parsedError = JSON.parse(error.message)

      if (parsedError.code) {
        setErrorCode(parsedError.code)
      }

      if (parsedError.code === "UNAUTHORIZED") {
        setErrorMessage(parsedError.message)
        setUpdateSubscription(true)
      }
    } catch (_e) {
      // If parsing fails, use the default error message
      setErrorMessage(error.message)
    }
  }, [error])

  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center">
        <EmptyPlaceholder className="min-h-[800px] w-full space-y-10">
          <EmptyPlaceholder.Title className="mt-0 p-10" variant="h1">
            {errorCode}
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
            <Balancer>
              <span className="mx-auto w-1/2 items-center justify-center py-4">{errorMessage}</span>
            </Balancer>
          </EmptyPlaceholder.Description>
          <EmptyPlaceholder.Action>
            <div className="mt-6 flex flex-row items-center justify-center gap-10">
              {/* TODO: add update subscription button */}
              {updateSubscription ? (
                <Button variant="primary" onClick={() => reset()}>
                  Update plan
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
