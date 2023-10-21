// import { cn } from "@builderai/ui"

// import { fontMapper } from "~/styles/fonts"

// import "~/styles/globals.css"

// export default function SitesLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       </head>
//       <body
//         className={cn(
//           "min-h-screen font-secondary antialiased",
//           fontMapper["font-primary"],
//           fontMapper["font-secondary"]
//         )}
//       >
//         <div className="flex min-h-screen flex-col">{children}</div>
//       </body>
//     </html>
//   )
// }

import "~/styles/globals.css"

import { ClerkProvider } from "@builderai/auth"
import { siteConfig } from "@builderai/config"
import { cn } from "@builderai/ui"
import { Toaster } from "@builderai/ui/toaster"

import { TailwindIndicator } from "~/components/tailwind-indicator"
import { ThemeProvider } from "~/components/theme-provider"
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
              "min-h-screen font-secondary antialiased",
              fontMapper["font-primary"],
              fontMapper["font-secondary"]
            )}
          >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {props.children}
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
