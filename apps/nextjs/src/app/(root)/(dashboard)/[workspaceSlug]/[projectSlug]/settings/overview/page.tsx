import { RenameProject } from "../_components/rename-project"

export default function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  const { projectSlug } = props.params

  return <RenameProject projectSlug={projectSlug} />
}
