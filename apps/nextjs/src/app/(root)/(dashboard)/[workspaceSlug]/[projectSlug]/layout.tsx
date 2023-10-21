import { userCanAccess } from "~/lib/project-guard"

export default async function ProjectLayout(props: {
  params: { projectSlug: string; workspaceSlug: string }
  children: React.ReactNode
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })

  return <>{props.children}</>
}
