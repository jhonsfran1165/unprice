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

  // delete first segment because it's always "/app" for the redirection from the middleware
  all.shift()

  // pages has another layout
  if (all.length > 3 && all.includes("pages")) {
    return null
  }

  let routes = [] as DashboardRoute[]
  let shortcuts = [] as Shortcut[]
  let baseUrl = "/"

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    routes = WORKSPACE_NAV
    shortcuts = WORKSPACE_SHORTCUTS
    baseUrl += `${workspaceSlug ?? all.at(0)}`
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    routes = PROJECT_NAV
    shortcuts = PROJECT_SHORTCUTS
    baseUrl += `/${projectSlug ?? all.at(1)}`
  }

  return <Sidebar routes={routes} shortcuts={shortcuts} baseUrl={baseUrl} />
}
