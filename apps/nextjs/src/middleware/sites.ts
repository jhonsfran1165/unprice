import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth"

import { parse } from "./utils"

export default function SitesMiddleware(req: NextAuthRequest) {
  const { domain, path, suddomain } = parse(req)
  // retrieve the current response
  const url = req.nextUrl

  if (!domain) {
    return NextResponse.next()
  }

  const rewrittenUrl = new URL(url.toString())

  if (rewrittenUrl.pathname.includes("/sites/")) {
    return NextResponse.next()
  }

  rewrittenUrl.pathname = `/sites/${suddomain ?? domain}/${path === "/" ? "" : path}`

  // console.log(`rewriting ${url} to ${rewrittenUrl}`)

  return NextResponse.rewrite(rewrittenUrl)
}
