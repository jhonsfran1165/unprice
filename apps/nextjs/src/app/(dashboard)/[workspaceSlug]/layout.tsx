import { getModulesApp } from "@builderai/config"

import Header from "~/components/header"
import { LegendStateHandler } from "~/components/state-handler"
import { SyncActiveOrgFromUrl } from "./sync-active-org-from-url"

export default function WorkspaceLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const modules = getModulesApp()

  return (
    <>
      <LegendStateHandler modulesApp={modules} />
      {/* TODO: Nuke it when we can do it serverside in Clerk! */}
      <SyncActiveOrgFromUrl />
      <Header showTabs />
      <main className="flex flex-1 flex-col overflow-hidden">
        {props.children}
      </main>
    </>
  )
}
