"use client"

import "@/styles/globals.css"
import { Inter } from "@next/font/google"
import localFont from "@next/font/local"
import { ThemeProvider } from "next-themes"

import { cn } from "@/lib/utils"
import { Layout } from "@/components/layout"

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="min-h-screen bg-white">
      <body className="overflow-y-scroll bg-gray-1100 bg-[url('/_static/grid.svg')]">
        <main className={cn(satoshi.variable, inter.variable)}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Layout>{children}</Layout>
          </ThemeProvider>
        </main>
      </body>
    </html>
  )
}
