import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth/server"

import {
  API_AUTH_ROUTE_PREFIX,
  APP_AUTH_ROUTES,
  APP_NON_WORKSPACE_ROUTES,
  AUTH_ROUTES,
  COOKIE_NAME_WORKSPACE,
} from "~/constants"
import { getWorkspacesUser } from "~/lib/session"
import { parse } from "~/middleware/utils"

export default function AppMiddleware(req: NextAuthRequest) {
  const url = new URL(req.nextUrl.origin)
  const { path, key: currentWorkspace, fullPath } = parse(req)
  const isLoggedIn = !!req.auth?.user
  const { user, userBelongsToWorkspace } = getWorkspacesUser(req.auth)
  const isAppAuthRoute = APP_AUTH_ROUTES.has(path)
  const isApiAuthRoute = path.startsWith(API_AUTH_ROUTE_PREFIX)
  const isNonWorkspaceRoute = APP_NON_WORKSPACE_ROUTES.has(path)

  // API routes we don't need to check if the user is logged in
  if (isApiAuthRoute || path.startsWith("/api/trpc")) {
    return NextResponse.next()
  }

  // AUTH routes we check is the user is logged in
  if (isAppAuthRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn || !user) {
    // User is not signed in redirect to signin
    return NextResponse.redirect(
      new URL(
        `${AUTH_ROUTES.SIGNIN}${
          fullPath === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`
        }`,
        req.url
      )
    )
  }

  // if the route is not a workspace specific route
  if (isNonWorkspaceRoute) {
    return NextResponse.rewrite(
      new URL(`/app${fullPath === "/" ? "" : fullPath}`, req.url)
    )
  }

  // TODO: recording page hits
  // if the user is trying to access a workspace specific route check if they have access
  // by checking if the workspace is in their list of workspaces from the jwt
  if (!currentWorkspace) {
    // if the user has no active workspace validate that the workspace exists in the jwt
    // and set the cookie to the first workspace, if no workspace exists redirect to signup
    const activeWorkspace = req.cookies.get(COOKIE_NAME_WORKSPACE)?.value

    if (activeWorkspace) {
      const userBelongsToWorkspace = (user.workspaces.some(
        (workspace) => workspace.slug === activeWorkspace
      ) ?? false) as boolean

      if (!userBelongsToWorkspace) {
        // User is accessing a user that's not them
        return NextResponse.redirect(new URL("/error", req.url))
      }

      url.pathname = `/${activeWorkspace}/overview`
      return NextResponse.redirect(url)
    } else {
      const firstWorkspace = user.workspaces[0]?.slug

      if (!firstWorkspace) {
        // this should never happen because every user should have at least one workspace which is their personal workspace by default
        // if the user has no active workspace redirect to onboarding
        // if this happens it's a bug when the user is created and the workspace is not set or the workspace is not created

        return NextResponse.redirect(new URL("/error", req.url))
      }

      url.pathname = `/${firstWorkspace}/overview`
      // To change a cookie, first create a response
      const response = NextResponse.redirect(url)

      // Setting a cookie with additional options
      response.cookies.set({
        name: COOKIE_NAME_WORKSPACE,
        value: firstWorkspace,
        httpOnly: true,
      })

      return response
    }
  }

  const isUserMemberWorkspace = userBelongsToWorkspace(currentWorkspace)

  if (!isUserMemberWorkspace) {
    // User is accessing a workspace that's not part of their workspaces
    return NextResponse.redirect(new URL("/error", req.url))
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(
    new URL(`/app${fullPath === "/" ? "" : fullPath}`, req.url)
  )
}
