// import { LegendStateHandler } from "~/components/state-handler"

import { headers } from "next/headers"

import DotPattern from "~/components/dot-pattern"
import Footer from "~/components/footer"
import Header from "~/components/header"
import { SyncActiveOrgFromUrl } from "~/components/sync-active-org-from-url"
import { TRPCReactProvider } from "~/trpc/provider"

export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <TRPCReactProvider headers={headers()}>
      <div className="flex min-h-screen flex-col">
        <SyncActiveOrgFromUrl />
        <DotPattern width={40} height={40} x={-1} y={-1} />
        <Header projectSlug={props.params.projectSlug} />
        <div className="flex grow flex-col">
          <main className="flex flex-1 flex-col">{props.children}</main>
        </div>
        <Footer />
      </div>
    </TRPCReactProvider>
  )
}
