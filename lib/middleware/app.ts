import { NextRequest, NextResponse } from "next/server"
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs"

import { parse } from "@/lib/middleware/utils"
import type { Database } from "@/lib/types/database.types"

export default async function AppMiddleware(req: NextRequest) {
  const { path } = parse(req)
  const res = NextResponse.next()

  const supabase = createMiddlewareSupabaseClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.email && path !== "/login" && path !== "/register") {
    return NextResponse.redirect(new URL("/login", req.url))
  } else if (
    session?.user?.email &&
    (path === "/login" || path === "/register")
  ) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.rewrite(new URL(`/_root${path}`, req.url))
}
