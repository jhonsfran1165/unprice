import "react-image-crop/dist/ReactCrop.css"
import "~/styles/globals.css"

import { SessionProvider } from "@builderai/auth/react"
import { auth } from "@builderai/auth/server"
// import { Analytics } from "@vercel/analytics/react"

import { Toaster } from "@builderai/ui/toaster"
import { TooltipProvider } from "@builderai/ui/tooltip"

import { TailwindIndicator } from "~/components/layout/tailwind-indicator"
import { TRPCReactProvider } from "~/trpc/client"

export default async function AuthenticatedLayout(props: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <>
      <SessionProvider session={session}>
        <TRPCReactProvider>
          <TooltipProvider delayDuration={300}>
            {props.children}
          </TooltipProvider>
        </TRPCReactProvider>
        <TailwindIndicator />
      </SessionProvider>
      {/* <Analytics /> */}
      <Toaster />
    </>
  )
}
