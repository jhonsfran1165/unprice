import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Toaster } from "@unprice/ui/sonner"
import { TooltipProvider } from "@unprice/ui/tooltip"

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
      <SpeedInsights />
      <Toaster richColors closeButton position="bottom-left" />
    </>
  )
}
