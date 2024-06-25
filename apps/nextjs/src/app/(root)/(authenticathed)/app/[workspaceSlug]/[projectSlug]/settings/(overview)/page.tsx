import { api } from "~/trpc/server"
import { RenameProjectForm } from "../_components/rename-project"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  return (
    <RenameProjectForm
      projectPromise={api.projects.getBySlug({
        slug: props.params.projectSlug,
      })}
    />
  )
}
