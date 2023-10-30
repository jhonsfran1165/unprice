import { api } from "~/trpc/server"
import { RenameProject } from "../_components/rename-project"

export const runtime = "edge"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug } = props.params
  const project = await api.project.bySlug.query({ slug: projectSlug })

  return <RenameProject project={project} />
}
