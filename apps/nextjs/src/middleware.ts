import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { authMiddleware } from "@builderai/auth"

import AppMiddleware from "~/middleware/app"
import { parse } from "~/middleware/utils"
import SitesMiddleware from "./middleware/sites"

const before = (req: NextRequest) => {
  const url = req.nextUrl.clone()
  const { domain, path, suddomain } = parse(req)

  if (url.pathname.includes("api/trpc")) {
    return NextResponse.next()
  }

  if (suddomain === "sites" || domain === "sites.localhost:3000") {
    return SitesMiddleware(req)
  }

  // TODO: add middleware to check the subdomain

  return NextResponse.next()
}

export default authMiddleware({
  signInUrl: "/signin",
  publicRoutes: [
    // "/",
    "/signout",
    "/opengraph-image.png",
    "/signin(.*)",
    "/sso-callback(.*)",
    "/terms(.*)",
    "/pricing(.*)",
    "/privacy(.*)",
    "/api(.*)",
    "/p(.*)",
  ],
  beforeAuth: before,
  debug: false,
  async afterAuth(auth, req) {
    const { domain, suddomain } = parse(req)

    if (
      auth.isPublicRoute ||
      domain === "builderai.io" ||
      domain === "builderai.vercel.app"
    ) {
      // Don't do anything for public routes and landing page
      return NextResponse.next()
    }

    if (
      suddomain === "app" ||
      domain === "app.localhost:3000" ||
      domain?.endsWith("jhonsfran.vercel.app")
    ) {
      return AppMiddleware(req, auth)
    }

    return NextResponse.next()
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _vercel (Vercel internals)
     * - _next (next internals)
     * - some-file.extension (static files)
     * - ignore pages starting with /p/ (next.js dynamic pages)
     */
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc|p)(.*)",
  ],
}
