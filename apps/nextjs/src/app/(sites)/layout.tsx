import { TooltipProvider } from "@unprice/ui/tooltip"
import { ThemeProvider, ToasterProvider } from "~/components/layout/theme-provider"
import { siteConfig } from "~/constants/layout"

import "~/styles/sites.css"
import { UpdateMarketingCookie } from "../(root)/auth/_components/update-marketing-cookie"

// TODO: get metadata from the site
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
    images: [{ url: "/og" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/og" }], // TODO: auto generate og image for sites
    creator: "jhonsfran",
  },
  metadataBase: new URL("https://sites.unprice.dev"),
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
      <body className={"min-h-screen antialiased"}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={300}>{props.children}</TooltipProvider>
        </ThemeProvider>

        <UpdateMarketingCookie />
        <ToasterProvider />
      </body>
    </html>
  )
}
