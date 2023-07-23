import { inter, satoshi } from "@/assets/fonts"

import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { TailwindIndicator } from "@/components/shared/tailwind-indicator"

import "@/styles/globals.css"

export const metadata = {
  title: "Improve this",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(
        "min-h-screen antialiased",
        satoshi.variable,
        inter.variable
      )}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">{children}</div>
          <TailwindIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
