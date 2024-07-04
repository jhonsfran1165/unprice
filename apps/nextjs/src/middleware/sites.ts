import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth"

import { getValidSubdomain, parse } from "./utils"

export default function SitesMiddleware(req: NextAuthRequest) {
  const { domain, path } = parse(req)
  const subdomain = getValidSubdomain(domain)
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
