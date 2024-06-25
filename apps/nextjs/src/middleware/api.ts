import { NextResponse } from "next/server"

import type { NextAuthRequest } from "@builderai/auth"
import { API_AUTH_ROUTE_PREFIX } from "~/constants"
import { parse } from "./utils"

export default function ApiMiddleware(req: NextAuthRequest) {
  const { path, fullPath } = parse(req)
  const isApiAuthRoute = path.startsWith(API_AUTH_ROUTE_PREFIX)

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  if (path.startsWith("/metatags")) {
    const url = req.nextUrl.searchParams.get("url")
    if (!url) {
      return NextResponse.rewrite(new URL("/metatags", req.url))
    }
    return NextResponse.rewrite(new URL(`/api/edge/metatags?url=${url}`, req.url))
  }

  // Note: we don't have to account for paths starting with `/api`
  // since they're automatically excluded via our middleware matcher
  return NextResponse.rewrite(new URL(`/api${fullPath}`, req.url))
}
