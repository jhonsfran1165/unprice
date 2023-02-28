import "@/styles/globals.css"
import { inter, satoshi } from "@/assets/fonts"

import { cn } from "@/lib/utils"
import { SiteFooter } from "@/components/shared/layout/site-footer"
import { ThemeProvider } from "@/components/shared/layout/theme-provider"
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
          "min-h-screen font-inter antialiased bg-base-skin text-base-text",
          satoshi.variable,
          inter.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            {/* <SiteHeader /> */}
            {children}
            <SiteFooter />
          </div>
          <TailwindIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
