import { TooltipProvider } from "@unprice/ui/tooltip"

import { allEndpointsProcedures } from "@unprice/trpc/routes"
import { Provider } from "jotai"
import type { ReactNode } from "react"
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
    <div className="min-h-screen overflow-hidden ">
      <TRPCReactProvider allEndpointsProcedures={allEndpointsProcedures}>
        <TooltipProvider delayDuration={300}>
          <Provider>
            <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
              {sidebar}
              <main className="flex w-full flex-1 flex-col overflow-hidden">
                {header}
                {breadcrumbs}
                <div className="hide-scrollbar flex-grow overflow-y-auto">{children}</div>
              </main>
            </div>
          </Provider>
        </TooltipProvider>
      </TRPCReactProvider>
      <ToasterProvider />
    </div>
  )
}
