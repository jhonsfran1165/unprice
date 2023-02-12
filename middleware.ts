import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/types/database.types"
import { parse } from "@/lib/middleware/utils"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { domain, path, key } = parse(req)

  const supabase = createMiddlewareSupabaseClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    if (path.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return res
}
