import { userCanAccess } from "~/lib/project-guard"
import { RenameProject } from "../_components/rename-project"

export default async function ProjectSettingsPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  const { projectSlug } = props.params

  return <RenameProject projectSlug={projectSlug} />
}
