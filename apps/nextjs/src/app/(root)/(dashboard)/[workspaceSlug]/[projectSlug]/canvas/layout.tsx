import HeaderTab from "~/components/header-tab"
import { DashboardShell } from "~/components/layout2/dashboard-shell"
import TabsNav from "~/components/layout2/tabs-nav"
import { NewCanvaDialog } from "./_components/new-canva"

export default function ProjectCanvasLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { workspaceSlug, projectSlug } = props.params
  return (
    <DashboardShell
      header={<HeaderTab title="Canvas" action={<NewCanvaDialog />} />}
      tabs={
        <TabsNav
          module="project"
          submodule="overview"
          basePath={`/${workspaceSlug}/${projectSlug}`}
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
