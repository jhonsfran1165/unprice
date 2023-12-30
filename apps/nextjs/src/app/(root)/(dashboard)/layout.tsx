import Header from "~/components/header"
import { SyncActiveOrgFromUrl } from "~/components/sync-active-org-from-url"

export default function DashboardLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <div className="flex h-screen flex-col">
      <SyncActiveOrgFromUrl />
      <Header />
      <div className="flex flex-1 overflow-hidden">{props.children}</div>
    </div>
  )
}
