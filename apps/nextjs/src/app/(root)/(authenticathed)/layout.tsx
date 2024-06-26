import { Analytics } from "@vercel/analytics/react"

import { Toaster } from "@builderai/ui/sonner"
import { TooltipProvider } from "@builderai/ui/tooltip"

import { TailwindIndicator } from "~/components/layout/tailwind-indicator"
import { TRPCReactProvider } from "~/trpc/client"

export default async function AuthenticatedLayout(props: {
  children: React.ReactNode
}) {
  return (
    <>
      <TRPCReactProvider>
        <TooltipProvider delayDuration={300}>{props.children}</TooltipProvider>
      </TRPCReactProvider>
      <TailwindIndicator />
      <Analytics />
      <Toaster richColors closeButton position="bottom-left" />
    </>
  )
}
