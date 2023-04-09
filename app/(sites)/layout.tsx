import "@/styles/globals.css"
import { inter, satoshi } from "@/assets/fonts"

import { cn } from "@/lib/utils"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { TailwindIndicator } from "@/components/shared/tailwind-indicator"
import { Toaster } from "@/components/ui/toaster"

export default async function RootLayout({
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
          "bg-base-bg text-base-text min-h-screen font-inter antialiased",
          satoshi.variable,
          inter.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            {/* <SiteHeader /> */}
            {children}
            <Footer />
          </div>
          <TailwindIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
