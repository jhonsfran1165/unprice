import "react-image-crop/dist/ReactCrop.css"
import "~/styles/globals.css"

import { headers } from "next/headers"

// import { Analytics } from "@vercel/analytics/react"

import { ClerkProvider } from "@builderai/auth"
import { siteConfig } from "@builderai/config"
import { Toaster } from "@builderai/ui/toaster"
import { cn } from "@builderai/ui/utils"

import { TailwindIndicator } from "~/components/tailwind-indicator"
import { ThemeProvider } from "~/components/theme-provider"
import { fontMapper } from "~/styles/fonts"
import { TRPCReactProvider } from "~/trpc/client"

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
              <TRPCReactProvider headers={headers()}>
                {props.children}
              </TRPCReactProvider>
              <TailwindIndicator />
            </ThemeProvider>
            {/* <Analytics /> */}
            <Toaster />
          </body>
        </html>
      </ClerkProvider>
    </>
  )
}
