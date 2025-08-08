import { redirect } from "next/navigation"
import type { SearchParams } from "nuqs/server"

export default async function ProjectOverviewPage(props: {
  params: { workspaceSlug: string; projectSlug: string }
  searchParams: SearchParams
}) {
  // redirect to dashboard
  redirect(`/${props.params.workspaceSlug}/${props.params.projectSlug}/dashboard`)
}
