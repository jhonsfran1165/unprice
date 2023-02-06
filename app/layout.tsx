import "@/styles/globals.css"
import { Inter } from "@next/font/google"
import localFont from "@next/font/local"

import { cn } from "@/lib/utils"
import BackGround from "@/components/shared/background"
import { TailwindIndicator } from "@/components/shared/tailwind-indicator"
import AppProviders from "./providers"

const satoshi = localFont({
  src: "../styles/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
  style: "normal",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="min-h-screen bg-white">
      <body className="overflow-y-scroll bg-gray-1100 bg-[url('/_static/grid.svg')]">
        <main className={cn(satoshi.variable, inter.variable)}>
          <AppProviders>
            <div className="flex min-h-screen flex-col justify-between">
              {/* activate or deactivate the background */}
              <div className={`${false ? "bg-gray-50" : ""} z-20`}>
                {children}
              </div>

              <BackGround />
            </div>
          </AppProviders>
        </main>
        <TailwindIndicator />
      </body>
    </html>
  )
}
