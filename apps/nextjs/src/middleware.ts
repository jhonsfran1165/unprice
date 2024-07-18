import { NextResponse } from "next/server"

import { auth } from "@builderai/auth/server"

import { getValidSubdomain, parse } from "~/lib/domains"
import ApiMiddleware from "~/middleware/api"
import AppMiddleware from "~/middleware/app"
import SitesMiddleware from "~/middleware/sites"
import { API_HOSTNAMES, APP_HOSTNAMES } from "./constants"

export default auth((req) => {
  const { domain } = parse(req)

  // 1. we validate api routes
  if (API_HOSTNAMES.has(domain)) {
    return ApiMiddleware(req)
  }

  // 2. we validate app routes inside the dashboard
  if (APP_HOSTNAMES.has(domain)) {
    return AppMiddleware(req)
  }

  if (getValidSubdomain(domain)) {
    // 3. validate site routes
    return SitesMiddleware(req)
  }

  return NextResponse.next()
})

export const config = {
  // matcher: [
  //   /*
  //    * Match all request paths except for the ones starting with:
  //    * - _vercel (Vercel internals)
  //    * - _next (next internals)
  //    * - some-file.extension (static files)
  //    * - api (api routes)
  //    */
  //   "/((?!.+\\.[\\w]+$|_next|api).*)",
  // ],

  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  // TODO: ignore public routes from here
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/ (special page for OG tags proxying)
     * 4. /_static (inside /public)
     * 5. /_vercel (Vercel internals)
     * 6. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    "/((?!api/|_next/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
}
