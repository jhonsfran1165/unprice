import MaxWidthWrapper from "~/components/max-width-wrapper"
import { SidebarNav } from "./_components/sidebar"
import { SyncActiveOrgFromUrl } from "./sync-active-org-from-url"

export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  return (
    <MaxWidthWrapper className="max-w-screen-xl">
      {/* TODO: Nuke it when we can do it serverside in Clerk! */}
      <SyncActiveOrgFromUrl />
      <div className="flex flex-col gap-12 sm:flex-1 sm:flex-row">
        <SidebarNav />
        <main className="flex flex-1 flex-col overflow-hidden">
          {props.children}
        </main>
      </div>
    </MaxWidthWrapper>
  )
}
