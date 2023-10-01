import { redirect } from "next/navigation"

// TODO: activate later. It is  hitting limits on vercel
// export const runtime = "edge"

/**
 * Suboptimal, would be better off doing this in middleware
 */
export default function WorkspacePage(props: {
  params: { workspaceSlug: string; projectSlug: string }
}) {
  redirect(`/${props.params.workspaceSlug}/overview`)
}
