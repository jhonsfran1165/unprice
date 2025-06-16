import { cn } from "@unprice/ui/utils"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import { ViewTransitions } from "next-view-transitions"
import "~/styles/globals.css"
import "~/styles/prosemirror.css"

import { VercelToolbar } from "@vercel/toolbar/next"
import { TailwindIndicator } from "~/components/layout/tailwind-indicator"
import { ThemeProvider } from "~/components/layout/theme-provider"
import { siteConfig } from "~/constants/layout"
import { fontMapper } from "~/styles/fonts"

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    // TODO: add a proper opengraph image
    images: [{ url: "/opengraph-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    // TODO: add a proper twitter image
    images: [{ url: "https://acme-corp-lib.vercel.app/opengraph-image.png" }],
    creator: "@jhonsfran",
  },
  metadataBase: new URL("https://unprice.dev"),
} satisfies Metadata

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const shouldInjectToolbar = process.env.NODE_ENV === "development"

  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
          />
          {/* <script src="https://unpkg.com/react-scan/dist/auto.global.js" /> */}
        </head>
        <body
          className={cn(
            "min-h-screen antialiased",
            fontMapper["font-primary"],
            fontMapper["font-secondary"],
            fontMapper["font-mono"]
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {props.children}
            {shouldInjectToolbar && <VercelToolbar />}
          </ThemeProvider>
          {/* <Analytics /> */}
          <Analytics />
          <SpeedInsights />
          <TailwindIndicator />
        </body>
      </html>
    </ViewTransitions>
  )
}
