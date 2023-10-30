import { userCanAccess } from "~/lib/project-guard"

export const runtime = "edge"

export default async function Page(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  await userCanAccess({
    projectSlug: props.params.projectSlug,
    workspaceSlug: props.params.workspaceSlug,
  })
  // TODO: get limits of this project for this workspace
  // const domain = await api.domain.getDomains.query()

  return <>testing</>
}
