import { NextResponse } from "next/server"

import { auth } from "@unprice/auth/server"

import { API_HOSTNAMES, APP_HOSTNAMES } from "@unprice/config"
import { getValidSubdomain, parse } from "~/lib/domains"
import ApiMiddleware from "~/middleware/api"
import AppMiddleware from "~/middleware/app"
import SitesMiddleware from "~/middleware/sites"

export default auth((req) => {
  const { domain, path } = parse(req)
  const subdomain = getValidSubdomain(domain) ?? ""

  // Bypass Vercel's required endpoint
  if (path.startsWith("/.well-known/vercel/flags")) {
    return NextResponse.next()
  }

  // 1. we validate api routes
  if (API_HOSTNAMES.has(domain)) {
    return ApiMiddleware(req)
  }

  // 2. we validate app routes inside the dashboard
  if (APP_HOSTNAMES.has(domain)) {
    return AppMiddleware(req)
  }

  // 3. validate subdomains www and empty
  if (subdomain === "" || subdomain === "www") {
    // protect the app routes from being accessed under the base domain or www subdomain
    if (path.startsWith("/dashboard")) {
      const url = new URL(req.nextUrl.origin)
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    // public routes under the base domain or www subdomain
    return NextResponse.next()
  }

  // rest of the routes are site routes
  return SitesMiddleware(req)
})

export const config = {
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
