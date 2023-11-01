// import { LegendStateHandler } from "~/components/state-handler"

export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    // <ReactQueryProvider>
    <div className="flex min-h-screen flex-col">
      {/* <SyncActiveOrgFromUrl />
        <DotPattern width={40} height={40} x={-1} y={-1} />
        <Header /> */}
      <div className="flex grow flex-col">
        <main className="flex flex-1 flex-col">{props.children}</main>
      </div>
      {/* <Footer /> */}
    </div>
    // </ReactQueryProvider>
  )
}
