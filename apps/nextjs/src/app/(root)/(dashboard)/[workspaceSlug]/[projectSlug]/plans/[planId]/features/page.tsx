import MaxWidthWrapper from "~/components/max-width-wrapper"
import { userCanAccessProject } from "~/lib/project-guard"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

export default async function DashboardPage(props: {
  params: { workspaceSlug: string; projectSlug: string; planId: string }
}) {
  const { projectSlug, workspaceSlug, planId } = props.params

  await userCanAccessProject({
    projectSlug,
    needsToBeInTier: ["PRO", "STANDARD", "FREE"],
  })

  return (
    <MaxWidthWrapper className="max-w-screen-2xl justify-center py-6">
      {"asdasd"}
    </MaxWidthWrapper>
  )
}
