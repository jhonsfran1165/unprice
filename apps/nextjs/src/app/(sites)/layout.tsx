import { cn } from "@builderai/ui"

import { fontMapper } from "~/styles/fonts"

import "~/styles/globals.css"

export default function SitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={cn(
          "min-h-screen font-secondary antialiased",
          fontMapper["font-primary"],
          fontMapper["font-secondary"]
        )}
      >
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  )
}
