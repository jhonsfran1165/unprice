"use client"

import { Typography } from "@unprice/ui/typography"

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <Typography variant="h2">Something went wrong!</Typography>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  )
}
