import { NextRequest, NextResponse } from "next/server"
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs"

import { parse } from "@/lib/middleware/utils"
import type { Database } from "@/lib/types/database.types"

export default async function AppMiddleware(req: NextRequest) {
  const { path } = parse(req)
  const res = NextResponse.next()
  const url = req.nextUrl
  const supabase = createMiddlewareSupabaseClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

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
