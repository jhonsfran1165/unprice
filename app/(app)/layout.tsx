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
      className={cn("antialiased", satoshi.variable, inter.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="overflow-y-scroll flex flex-col justify-between">
            {children}
          </div>
          <TailwindIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
