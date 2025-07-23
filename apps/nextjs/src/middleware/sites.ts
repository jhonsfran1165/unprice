import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@unprice/auth"

import { getValidSubdomain, parse } from "~/lib/domains"

export default function SitesMiddleware(req: NextAuthRequest) {
  const { domain, path } = parse(req)
  const subdomain = getValidSubdomain(domain)
  const isTrackingRoute = path.startsWith("/api/tracking")

  if (isTrackingRoute) {
    return NextResponse.next()
  }

  // retrieve the current response
  const url = req.nextUrl

  if (!domain) {
    return NextResponse.next()
  }

  const rewrittenUrl = new URL(url.toString())

  if (rewrittenUrl.pathname.includes("/sites/")) {
    return NextResponse.next()
  }

  rewrittenUrl.pathname = `/sites/${subdomain ?? domain}/${path === "/" ? "" : path}`

  return NextResponse.rewrite(rewrittenUrl)
}
