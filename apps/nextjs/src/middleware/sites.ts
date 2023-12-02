import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { parse } from "./utils"

export default function SitesMiddleware(req: NextRequest) {
  const { domain, path, suddomain } = parse(req)
  // retrieve the current response
  const res = NextResponse.next()
  const url = req.nextUrl

  console.log("sites middleware", domain, path, suddomain)

  if (!domain) {
    return NextResponse.next()
  }

  const rewrittenUrl = new URL(url.toString())

  if (rewrittenUrl.pathname.includes("/sites/")) {
    return NextResponse.next()
  }

  rewrittenUrl.pathname = `/sites${path === "/" ? "" : path}`

  console.log(`rewriting ${url} to ${rewrittenUrl}`)

  return NextResponse.rewrite(rewrittenUrl)
}
