import { getSession } from "@unprice/auth/server-rsc"
import { isSlug } from "@unprice/db/utils"
import { Separator } from "@unprice/ui/separator"
import { FlagValues } from "flags/react"
import { Fragment, Suspense } from "react"
import Header from "~/components/layout/header"
import { Logo } from "~/components/layout/logo"
import { unprice } from "~/lib/unprice"
import { HydrateClient, trpc } from "~/trpc/server"
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
  if (all.length > 3 && all.includes("pages")) {
    return null
  }

  let workspace: string | null = null
  let project: string | null = null

  let customerEntitlements: Array<{
    [key: string]: boolean
  }> = []

  if (isSlug(workspaceSlug) || isSlug(all.at(0))) {
    const session = await getSession()
    workspace = `${workspaceSlug ?? all.at(0)}` as string

    // prefetch data for the workspace and project
    void trpc.workspaces.listWorkspacesByActiveUser.prefetch(undefined, {
      staleTime: 1000 * 60 * 60, // 1 hour
    })

    const atw = session?.user.workspaces.find((w) => w.slug === workspace)

    if (atw) {
      // prefetch entitlements only for non-internal workspaces
      if (!atw.isMain) {
        const { result: entitlementsResult } = await unprice.customers.getEntitlements(
          atw.unPriceCustomerId
        )

        // convert to an array of objects
        customerEntitlements =
          entitlementsResult?.entitlements.map((entitlement) => ({
            [entitlement.featureSlug]: true,
          })) ?? []
      }
    }
  }

  if (isSlug(projectSlug) || isSlug(all.at(1))) {
    project = `${projectSlug ?? all.at(1)}` as string

    void trpc.projects.listByActiveWorkspace.prefetch(undefined, {
      staleTime: 1000 * 60 * 60, // 1 hour
    })
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

          {customerEntitlements.length > 0 && <FlagValues values={customerEntitlements} />}

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
