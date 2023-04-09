import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

import { HOME_HOSTNAMES } from "@/lib/constants"
import { parse } from "@/lib/middleware/utils"
// import { recordClick } from "@/lib/tinybird"
import { RootDomainProps } from "@/lib/types"
import { redis } from "@/lib/upstash"

export default async function RootMiddleware(
  req: NextRequest,
  ev: NextFetchEvent
) {
  const { domain } = parse(req)

  if (!domain) {
    return NextResponse.next()
  }

  if (HOME_HOSTNAMES.has(domain) || domain.endsWith(".vercel.app")) {
    return NextResponse.next()
  } else {
    // ev.waitUntil(recordClick(domain, req)) // record clicks on root page (if domain is not home)

    const { target, rewrite } =
      (await redis.get<RootDomainProps>(`sites:${domain}`)) || {}
    if (target) {
      if (rewrite) {
        return NextResponse.rewrite(target)
      } else {
        return NextResponse.redirect(target)
      }
    } else {
      // rewrite to root page unless the user defines a site to redirect to
      return NextResponse.rewrite(new URL(`/_sites/${domain}`, req.url))
    }
  }
}
