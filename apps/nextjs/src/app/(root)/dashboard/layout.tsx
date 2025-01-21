import { TooltipProvider } from "@unprice/ui/tooltip"

import { allEndpointsProcedures } from "@unprice/api/routes"
import { getSession } from "@unprice/auth/server-rsc"
import { Fragment, type ReactNode } from "react"
import { EntitlementProvider } from "~/components/entitlement-provider"
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
  const session = await getSession()

  return (
    <Fragment>
      <TRPCReactProvider allEndpointsProcedures={allEndpointsProcedures}>
        <TooltipProvider delayDuration={300}>
          <EntitlementProvider session={session}>
            <div className="flex h-screen flex-col lg:flex-row">
              {sidebar}
              <main className="flex w-full flex-1 flex-col overflow-hidden">
                {header}
                {breadcrumbs}
                <div className="hide-scrollbar flex-grow overflow-y-auto">{children}</div>
              </main>
            </div>
          </EntitlementProvider>
        </TooltipProvider>
      </TRPCReactProvider>
      <ToasterProvider />
      <TailwindIndicator />
    </Fragment>
  )
}
