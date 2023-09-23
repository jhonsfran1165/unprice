import "react-image-crop/dist/ReactCrop.css"
import "~/styles/globals.css"

import { Analytics } from "@vercel/analytics/react"

import { ClerkProvider } from "@builderai/auth"
import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Toaster } from "@builderai/ui/toaster"

import { TailwindIndicator } from "~/components/tailwind-indicator"
import { ThemeProvider } from "~/components/theme-provider"
import { cal, inter, satoshi } from "~/styles/fonts"

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
    creator: "@jullerino",
  },
  metadataBase: new URL("https://acme-corp.jumr.dev"),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
          <body
            className={cn(
              "font-inter min-h-screen antialiased",
              satoshi.variable,
              cal.variable,
              inter.variable
            )}
          >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {props.children}
              <TailwindIndicator />
            </ThemeProvider>
            <Analytics />
            <Toaster />
          </body>
        </html>
      </ClerkProvider>
    </>
  )
}
