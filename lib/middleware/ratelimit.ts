import { NextFetchEvent, NextRequest, NextResponse } from "next/server"

import { parse } from "@/lib/middleware/utils"
import { ratelimit } from "@/lib/upstash"

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
): Promise<Response | undefined> {
  const { ip } = parse(req)
  const { success } = await ratelimit.limit(ip)

  return success
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/blocked", req.url))
}
