import { TooltipProvider } from "@unprice/ui/tooltip"

import { allEndpointsProcedures } from "@unprice/api/routes"
import { Fragment, type ReactNode } from "react"
import { TailwindIndicator } from "~/components/layout/tailwind-indicator"
import { ToasterProvider } from "~/components/layout/theme-provider"
import { TRPCReactProvider } from "~/trpc/client"

export default async function DashboardLayout({
  breadcrumbs,
  sidebar,
  header,
  children,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
  sidebar: ReactNode
  header: ReactNode
}) {
  return (
    <Fragment>
      <TRPCReactProvider allEndpointsProcedures={allEndpointsProcedures}>
        <TooltipProvider delayDuration={300}>
          <div className="flex h-screen flex-col lg:flex-row">
            {sidebar}
            <main className="flex w-full flex-1 flex-col overflow-hidden">
              {header}
              {breadcrumbs}
              <div className="hide-scrollbar flex-grow overflow-y-auto">{children}</div>
            </main>
          </div>
        </TooltipProvider>
      </TRPCReactProvider>
      <ToasterProvider />
      <TailwindIndicator />
    </Fragment>
  )
}
