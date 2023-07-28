import { NextFetchEvent, NextRequest, NextResponse } from "next/server"
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs"

import { parse } from "@/lib/middleware/utils"
import { recordPageView } from "@/lib/tinybird"
import type { Database } from "@/lib/types/database.types"

export default async function AppMiddleware(
  req: NextRequest,
  ev: NextFetchEvent
) {
  const { path, domain, key } = parse(req)
  const res = NextResponse.next()
  const url = req.nextUrl
  const supabase = createMiddlewareSupabaseClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // testing metrics to tinybird
  ev.waitUntil(recordPageView({ domain, req, key })) // record clicks on root page (if domain is not home)

  if (!session?.user?.email && !["/login", "/register"].includes(path)) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  } else if (session?.user?.email && ["/login", "/register"].includes(path)) {
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  url.pathname = `/root${path === "/" ? "" : path}`

  return NextResponse.rewrite(url)
}
