import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { authMiddleware } from "@builderai/auth/server"

import AppMiddleware from "~/middleware/app"
import { parse } from "~/middleware/utils"

const before = (req: NextRequest) => {
  const url = req.nextUrl.clone()

  if (url.pathname.includes("api/trpc")) {
    return NextResponse.next()
  }

  // TODO: add middleware to check the subdomain

  return NextResponse.next()
}

export default authMiddleware({
  signInUrl: "/signin",
  publicRoutes: [
    "/signout",
    "/opengraph-image.png",
    "/signin(.*)",
    "/sso-callback(.*)",
    "/terms(.*)",
    "/pricing(.*)",
    "/privacy(.*)",
    "/api(.*)",
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
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/, /_auth/ (special pages for OG tags proxying, password protection)
     * 4. root/ app directory
     * 5. sites/ sites directory
     * 6. /_static (inside /public)
     * 7. /_vercel (Vercel internals)
     * 8. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_proxy/|_auth/|root/|sites/|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
}
