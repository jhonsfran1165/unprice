import { RequestCookies, ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies"
import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth"

import { COOKIE_NAME_PROJECT, COOKIE_NAME_WORKSPACE } from "@builderai/config"
import {
  API_AUTH_ROUTE_PREFIX,
  API_TRPC_ROUTE_PREFIX,
  APP_AUTH_ROUTES,
  APP_NON_WORKSPACE_ROUTES,
  AUTH_ROUTES,
} from "~/constants"
import { getWorkspacesUser } from "~/lib/session"
import { parse } from "~/middleware/utils"

/**
 * Copy cookies from the Set-Cookie header of the response to the Cookie header of the request,
 * so that it will appear to SSR/RSC as if the user already has the new cookies.
 */
function applySetCookie(req: NextAuthRequest, res: NextResponse) {
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
    if (key === "x-middleware-override-headers" || key.startsWith("x-middleware-request-")) {
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
  if (isApiAuthRoute || isApiTrpcRoute || isAppAuthRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn || !user) {
    // User is not signed in redirect to sign in
    return NextResponse.redirect(
      new URL(
        `${AUTH_ROUTES.SIGNIN}${fullPath === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url
      )
    )
  }

  // if the route is not a workspace route
  if (isNonWorkspaceRoute) {
    return NextResponse.rewrite(new URL(`/app${fullPath === "/" ? "" : fullPath}`, req.url))
  }

  // TODO: recording page hits

  // if not workspace in path check cookies or jwt
  if (!currentWorkspaceSlug) {
    const redirectWorkspaceSlug =
      req.cookies.get(COOKIE_NAME_WORKSPACE)?.value ?? user.workspaces[0]?.slug

    // there is a cookie/jwt claim for the workspace redirect
    if (redirectWorkspaceSlug && redirectWorkspaceSlug !== "") {
      url.pathname = `/${redirectWorkspaceSlug}`
      return NextResponse.redirect(url)
    }

    // TODO: if the user has no active workspace redirect to onboarding

    // this should never happen because every user should have at least one workspace that is created on signup
    return NextResponse.redirect(new URL("/error", req.url))
  }

  // check jwt claim for the workspace
  const isUserMemberWorkspace = userBelongsToWorkspace(currentWorkspaceSlug)
  const response = NextResponse.rewrite(new URL(`/app${fullPath === "/" ? "" : fullPath}`, req.url))

  // if the user is not a member of the workspace redirect to root path to be handled by the middleware again
  if (!isUserMemberWorkspace) {
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // we use this cookies to forward them to the API on RSC calls
  // client calls are handled by the UpdateClientCookie component

  // set cookies if the user has access to the workspace
  response.cookies.set(COOKIE_NAME_WORKSPACE, currentWorkspaceSlug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/",
  })

  // TODO: what happen if the project slug is not xxx-xxx format?
  const currentProjectSlug = path.split("/")[2] ?? ""

  // cookie for calling the api
  response.cookies.set(COOKIE_NAME_PROJECT, currentProjectSlug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/",
  })

  // Apply those cookies to the request
  applySetCookie(req, response)

  return response
}
