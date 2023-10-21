import { redirect } from "next/navigation"

export const runtime = "edge"

/**
 * Suboptimal, would be better off doing this in middleware
 */
export default function ProjectPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  redirect(
    `/${props.params.workspaceSlug}/${props.params.projectSlug}/overview`
  )
}
