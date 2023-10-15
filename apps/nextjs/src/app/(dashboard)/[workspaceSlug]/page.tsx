import { redirect } from "next/navigation"

export const runtime = "edge"

/**
 * Suboptimal, would be better off doing this in middleware
 */
export default function WorkspacePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  redirect(`/${props.params.workspaceSlug}/overview`)
}
