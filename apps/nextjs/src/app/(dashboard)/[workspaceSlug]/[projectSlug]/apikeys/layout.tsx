import { DashboardShell } from "~/components/dashboard-shell"
import { userCanAccess } from "~/lib/project-guard"

export default async function ApiKeyLayout(props: {
  params: { projectSlug: string; workspaceSlug: string }
  children: React.ReactNode
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  return (
    <DashboardShell
      title="Projects"
      className="space-y-6"
      module="project"
      submodule="apikeys"
    >
      {props.children}
    </DashboardShell>
  )
}
