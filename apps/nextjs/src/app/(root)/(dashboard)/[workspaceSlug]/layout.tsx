// import { LegendStateHandler } from "~/components/state-handler"
import { SyncActiveOrgFromUrl } from "~/components/sync-active-org-from-url"

export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <>
      {/* <LegendStateHandler /> */}
      {/* TODO: Nuke it when we can do it server side in Clerk! */}
      <SyncActiveOrgFromUrl />
      <main className="flex flex-1 flex-col">{props.children}</main>
    </>
  )
}
