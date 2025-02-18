import { TooltipProvider } from "@unprice/ui/tooltip"

import { allEndpointsProcedures } from "@unprice/api/routes"
import { Provider } from "jotai"
import { cookies } from "next/headers"
import { Fragment, type ReactNode } from "react"
import { cloakSSROnlySecret } from "ssr-only-secrets"
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
  // FIXME:: workaround to get the cookies on the client on SSR
  const encryptedCookiePromise = Promise.resolve(cookies()).then((cookies) => {
    return cloakSSROnlySecret(cookies.toString(), "COOKIE_ENCRYPTION_KEY")
  })

  return (
    <Fragment>
      <TRPCReactProvider
        allEndpointsProcedures={allEndpointsProcedures}
        cookiePromise={encryptedCookiePromise}
      >
        <TooltipProvider delayDuration={300}>
          <Provider>
            <div className="flex h-screen flex-col lg:flex-row">
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
      <TailwindIndicator />
    </Fragment>
  )
}
