"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@unprice/ui/button"
import { Typography } from "@unprice/ui/typography"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
  const router = useRouter()

  // TODO: improve this
  return (
    <div className="mt-20 flex flex-col items-center space-x-4">
      <Typography variant="h1">Something went wrong</Typography>
      <Image
        alt="missing site"
        src="/app-launch.svg"
        width={400}
        height={400}
        className="invert-0 filter dark:invert"
      />
      <p className="py-5 text-lg text-stone-500">{error.message}</p>

      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </Button>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => router.back()
        }
      >
        Back
      </Button>
    </div>
  )
}
