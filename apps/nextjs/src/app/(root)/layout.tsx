import "~/styles/globals.css"
import "~/styles/prosemirror.css"
import type { Metadata, Viewport } from "next"
import { ViewTransitions } from "next-view-transitions"

import { cn } from "@unprice/ui/utils"

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
    images: [{ url: "/opengraph-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
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
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
          />
        </head>
        <body
          className={cn(
            "min-h-screen font-secondary antialiased",
            fontMapper["font-primary"],
            fontMapper["font-secondary"]
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {props.children}
          </ThemeProvider>
          {/* <Analytics /> */}
        </body>
      </html>
    </ViewTransitions>
  )
}
