import { isSlug } from "@builderai/db/utils"
import { Sidebar } from "~/components/navigation/sidebar"
import { PROJECT_NAV, PROJECT_SHORTCUTS } from "~/constants/projects"
import { WORKSPACE_NAV, WORKSPACE_SHORTCUTS } from "~/constants/workspaces"
import type { DashboardRoute, Shortcut } from "~/types"

export default function DashboardNavigationDesktopSlot(props: {
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

  // delete first segment because it's always "app"
  all.shift()

  let routes = [] as DashboardRoute[]
  let shortcuts = [] as Shortcut[]
  let baseUrl = "/"

  if (isSlug(workspaceSlug)) {
    routes = WORKSPACE_NAV
    shortcuts = WORKSPACE_SHORTCUTS
    baseUrl += `${workspaceSlug}/`
    // delete workspace slug from segments
    all.shift()
  }

  if (isSlug(projectSlug)) {
    routes = PROJECT_NAV
    shortcuts = PROJECT_SHORTCUTS
    baseUrl += `${projectSlug}`
    // delete project slug from segments
    all.shift()
  }

  // const pathname = all.length ? `${all.join("/")}` : ""

  return <Sidebar routes={routes} shortcuts={shortcuts} baseUrl={baseUrl} />
}
