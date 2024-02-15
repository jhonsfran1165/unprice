import "react-image-crop/dist/ReactCrop.css"
import "~/styles/globals.css"

import { SessionProvider } from "@builderai/auth/react"
import { auth } from "@builderai/auth/server"
// import { Analytics } from "@vercel/analytics/react"

import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Toaster } from "@builderai/ui/toaster"
import { TooltipProvider } from "@builderai/ui/tooltip"

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

export default async function RootLayout(props: { children: React.ReactNode }) {
  const session = await auth()

  console.log("session", session)

  // TODO: migrate this to authenticated routes
  return (
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
          <SessionProvider session={session}>
            <TRPCReactProvider>
              <TooltipProvider delayDuration={300}>
                {props.children}
              </TooltipProvider>
            </TRPCReactProvider>
            <TailwindIndicator />
          </SessionProvider>
        </ThemeProvider>
        {/* <Analytics /> */}
        <Toaster />
      </body>
    </html>
  )
}
