import { SessionProvider } from "@builderai/auth/react"
import { auth } from "@builderai/auth/server-rsc"
// import { Analytics } from "@vercel/analytics/react"

import { Toaster } from "@builderai/ui/sonner"
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
          <TooltipProvider delayDuration={300}>{props.children}</TooltipProvider>
        </TRPCReactProvider>
        <TailwindIndicator />
      </SessionProvider>
      {/* <Analytics /> */}
      <Toaster richColors closeButton position="bottom-left" />
    </>
  )
}
