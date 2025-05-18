import { Button } from "@unprice/ui/button"
import { Pencil } from "lucide-react"
import { notFound } from "next/navigation"
import { DashboardShell } from "~/components/layout/dashboard-shell"
import HeaderTab from "~/components/layout/header-tab"
import { api } from "~/trpc/server"
import { ProjectDialog } from "../../_components/project-dialog"

export default async function ProjectSettingsLayout(props: {
  children: React.ReactNode
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { project } = await api.projects.getBySlug({
    slug: props.params.projectSlug,
  })

  if (!project) {
    return notFound()
  }

  return (
    <DashboardShell
      header={
        <HeaderTab
          title="General Settings"
          description="Manage your project settings"
          action={
            <ProjectDialog defaultValues={project}>
              <Button variant={"outline"}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            </ProjectDialog>
          }
        />
      }
    >
      {props.children}
    </DashboardShell>
  )
}
