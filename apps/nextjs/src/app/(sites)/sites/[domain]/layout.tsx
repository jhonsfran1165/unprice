import { Toaster } from "@builderai/ui/sonner"
import { TooltipProvider } from "@builderai/ui/tooltip"
import { ThemeProvider } from "~/components/layout/theme-provider"
import { siteConfig } from "~/constants/layout"
import "~/styles/globals.css"
import "~/styles/prosemirror.css"

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

export default function SitesLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </head>
      <body className={"font-secondary min-h-screen antialiased"}>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={300}>{props.children}</TooltipProvider>
        </ThemeProvider>


        <Toaster richColors closeButton position="bottom-left" />
      </body>
    </html>
  )
}
