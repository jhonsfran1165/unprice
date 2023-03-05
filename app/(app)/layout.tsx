import "@/styles/globals.css"
import { inter, satoshi } from "@/assets/fonts"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/shared/layout/theme-provider"
import { TailwindIndicator } from "@/components/shared/tailwind-indicator"
import { Toaster } from "@/components/ui/toaster"

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
        "font-inter antialiased bg-base-skin text-base-text bg-[url('/_static/grid.svg')]",
        satoshi.variable,
        inter.variable
      )}
      suppressHydrationWarning
    >
      <body className="overflow-y-scroll flex flex-col justify-between">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <TailwindIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
