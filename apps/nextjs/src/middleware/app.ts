import {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth/server"

import {
  API_AUTH_ROUTE_PREFIX,
  API_TRPC_ROUTE_PREFIX,
  APP_AUTH_ROUTES,
  APP_NON_WORKSPACE_ROUTES,
  AUTH_ROUTES,
  COOKIE_NAME_PROJECT,
  COOKIE_NAME_WORKSPACE,
} from "~/constants"
import { getWorkspacesUser } from "~/lib/session"
import { parse } from "~/middleware/utils"

function isSlug(str: string) {
  return /^[a-z0-9-]+-[a-z0-9-]+$/.test(str)
}

/**
 * Copy cookies from the Set-Cookie header of the response to the Cookie header of the request,
 * so that it will appear to SSR/RSC as if the user already has the new cookies.
 */
function applySetCookie(req: NextRequest, res: NextResponse) {
  // 1. Parse Set-Cookie header from the response
  const setCookies = new ResponseCookies(res.headers)

  // 2. Construct updated Cookie header for the request
  const newReqHeaders = new Headers(req.headers)
  const newReqCookies = new RequestCookies(newReqHeaders)
  setCookies.getAll().forEach((cookie) => newReqCookies.set(cookie))

  // 3. Set up the “request header overrides” (see https://github.com/vercel/next.js/pull/41380)
  //    on a dummy response
  // NextResponse.next will set x-middleware-override-headers / x-middleware-request-* headers
  const dummyRes = NextResponse.next({ request: { headers: newReqHeaders } })

  // 4. Copy the “request header overrides” headers from our dummy response to the real response
  dummyRes.headers.forEach((value, key) => {
    if (
      key === "x-middleware-override-headers" ||
      key.startsWith("x-middleware-request-")
    ) {
      res.headers.set(key, value)
    }
  })
}

export default function AppMiddleware(req: NextAuthRequest) {
  const url = new URL(req.nextUrl.origin)
  const { path, key: currentWorkspaceSlug, fullPath } = parse(req)
  const isLoggedIn = !!req.auth?.user
  const { user, userBelongsToWorkspace } = getWorkspacesUser(req.auth)
  const isAppAuthRoute = APP_AUTH_ROUTES.has(path)
  const isApiAuthRoute = path.startsWith(API_AUTH_ROUTE_PREFIX)
  const isApiTrpcRoute = path.startsWith(API_TRPC_ROUTE_PREFIX)
  const isNonWorkspaceRoute = APP_NON_WORKSPACE_ROUTES.has(path)

  // API routes we don't need to check if the user is logged in
  if (isApiAuthRoute || isApiTrpcRoute) {
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

  // if the user has no active workspace validate that the workspace exists in the jwt
  // and set the cookie to the first workspace, if no workspace exists redirect to signup
  const cookieWorkspace = req.cookies.get(COOKIE_NAME_WORKSPACE)?.value

  // TODO: recording page hits
  // if the user is trying to access a workspace specific route check if they have access
  // by checking if the workspace is in their list of workspaces from the jwt
  if (!currentWorkspaceSlug) {
    if (cookieWorkspace) {
      const isUserMemberWorkspace = userBelongsToWorkspace(cookieWorkspace)

      if (!isUserMemberWorkspace) {
        // User is accessing a user that's not them form the cookie
        url.pathname = `/`
        const response = NextResponse.redirect(url)

        // remove the workspace cookie
        response.cookies.delete(COOKIE_NAME_WORKSPACE)
        return response
      }

      url.pathname = `/${cookieWorkspace}/overview`
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
      return NextResponse.redirect(url)
    }
  }

  const isUserMemberWorkspace = userBelongsToWorkspace(currentWorkspaceSlug)

  if (!isUserMemberWorkspace) {
    url.pathname = `/`
    return NextResponse.redirect(url)
  }

  const response = NextResponse.rewrite(
    new URL(`/app${fullPath === "/" ? "" : fullPath}`, req.url)
  )

  // check if the cookie workspace is the same as the current workspace
  // if not, update the cookie
  if (
    cookieWorkspace !== currentWorkspaceSlug &&
    isSlug(currentWorkspaceSlug)
  ) {
    response.cookies.set(COOKIE_NAME_WORKSPACE, currentWorkspaceSlug, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Apply those cookies to the request
    applySetCookie(req, response)
  }

  const currentProjectSlug = path.split("/")[2] ?? ""
  // check if the current project slug is a valid slug, slug can only contain lowercase letters, numbers and hyphens and no spaces, and at least 2 words
  const cookieProject = req.cookies.get(COOKIE_NAME_PROJECT)?.value

  console.log(
    "currentProjectSlug",
    currentProjectSlug,
    "cookieProject",
    cookieProject
  )

  if (currentProjectSlug !== cookieProject && isSlug(currentProjectSlug)) {
    response.cookies.set(COOKIE_NAME_PROJECT, currentProjectSlug, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Apply those cookies to the request
    applySetCookie(req, response)
  }

  // otherwise, rewrite the path to /app
  return response
}
