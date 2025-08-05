import { getSession } from "@unprice/auth/server-rsc"
import { isSlug } from "@unprice/db/utils"
import { Separator } from "@unprice/ui/separator"
import { Fragment, Suspense } from "react"
import Flags from "~/components/layout/flags"
import Header from "~/components/layout/header"
import { Logo } from "~/components/layout/logo"
import { entitlementFlag } from "~/lib/flags"
import { unprice } from "~/lib/unprice"
import { HydrateClient, prefetch, trpc } from "~/trpc/server"
import { ProjectSwitcher } from "../../_components/project-switcher"
import { ProjectSwitcherSkeleton } from "../../_components/project-switcher-skeleton"
import { UpdateClientCookie } from "../../_components/update-client-cookie"
import { WorkspaceSwitcher } from "../../_components/workspace-switcher"
import { WorkspaceSwitcherSkeleton } from "../../_components/workspace-switcher-skeleton"

export default async function Page(props: {
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
  // if (all.length > 3 && all.includes("pages")) {
  //   return null
  // }

  let workspace: string | null = null
  let project: string | null = null
  let customerEntitlements: {
    [x: string]: boolean
  }[] = []

  let isMain = false
  let customerId = ""

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    const session = await getSession()
    workspace = `${workspaceSlug ?? all.at(0)}` as string

    // prefetch data for the workspace and project
    prefetch(
      trpc.workspaces.listWorkspacesByActiveUser.queryOptions(undefined, {
        staleTime: 1000 * 60 * 60, // 1 hour
      })
    )

    const atw = session?.user.workspaces.find((w) => w.slug === workspace)

    if (atw) {
      isMain = atw.isMain
      customerId = atw.unPriceCustomerId

      // prefetch entitlements only for non-main workspaces
      if (!atw.isMain) {
        const { result: featuresResult } = await unprice.projects.getFeatures()

        const features = featuresResult?.features ?? []

        customerEntitlements = await Promise.all(
          features.map(async (feature) => ({
            [feature.slug]: await entitlementFlag(feature.slug),
          }))
        )
      }
    }
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    project = `${projectSlug ?? all.at(1)}` as string

    prefetch(
      trpc.projects.listByActiveWorkspace.queryOptions(undefined, {
        staleTime: 1000 * 60 * 60, // 1 hour
      })
    )
  }

  if (!workspace && !project) {
    return (
      <Header className="px-4">
        <UpdateClientCookie workspaceSlug={workspace} projectSlug={project} />
        <Logo className="size-6 text-lg" />
      </Header>
    )
  }

  return (
    <Header>
      <UpdateClientCookie workspaceSlug={workspace} projectSlug={project} />
      <HydrateClient>
        <Fragment>
          {workspace && (
            <Suspense fallback={<WorkspaceSwitcherSkeleton />}>
              <WorkspaceSwitcher workspaceSlug={workspace} />
            </Suspense>
          )}

          <Flags
            customerEntitlements={customerEntitlements}
            isMain={isMain}
            customerId={customerId}
          />

          {project && (
            <Fragment>
              <div className="flex size-4 items-center justify-center px-2">
                <Separator className="rotate-[30deg]" orientation="vertical" />
              </div>
              <Suspense fallback={<ProjectSwitcherSkeleton />}>
                <ProjectSwitcher />
              </Suspense>
            </Fragment>
          )}
        </Fragment>
      </HydrateClient>
    </Header>
  )
}
