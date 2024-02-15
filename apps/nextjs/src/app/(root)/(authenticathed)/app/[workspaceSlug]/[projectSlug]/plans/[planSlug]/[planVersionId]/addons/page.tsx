export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string; planId: string }
}) {
  const { projectSlug, workspaceSlug, planId } = props.params

  return "Hello world"
}
