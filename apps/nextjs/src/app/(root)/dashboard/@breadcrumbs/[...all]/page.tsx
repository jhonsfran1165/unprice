import { isSlug } from "@unprice/db/utils"
import BreadcrumbsApp from "~/components/layout/breadcrumbs"

export default function Page(props: {
  params: {
    all: string[]
  }
  searchParams: {
    workspaceSlug: string
    projectSlug: string
  }
}) {
  const { all } = props.params
  const { workspaceSlug, projectSlug } = props.searchParams

  // delete the first segment, which is always "/app"
  all.shift()

  // pages has another layout
  // if (all.length > 3 && all.includes("pages")) {
  //   return null
  // }

  let baseUrl = "/"

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    baseUrl += `${workspaceSlug ?? all.at(0)}`
    // delete workspace slug from segments
    all.shift()
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    baseUrl += `/${projectSlug ?? all.at(1)}`
    // delete project slug from segments
    // all.shift()
  }

  return (
    <div className="px-4 md:px-6">
      <BreadcrumbsApp breadcrumbs={all} baseUrl={baseUrl} />
    </div>
  )
}
