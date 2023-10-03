import { DashboardShell } from "~/components/dashboard-shell"
import { api } from "~/trpc/server"
import { RenameProject } from "./_components/rename-project"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug } = props.params
  const project = await api.project.bySlug.query({ slug: projectSlug })

  return (
    <DashboardShell
      title="Project"
      module="project"
      submodule="settings"
      routeSlug="settings"
      description="Manage your project"
      className="space-y-4"
    >
      <RenameProject
        currentName={project.name ?? ""}
        projectSlug={projectSlug}
      />
    </DashboardShell>
  )
}
