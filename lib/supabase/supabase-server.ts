import { cookies, headers } from "next/headers"
import { createServerComponentSupabaseClient } from "@supabase/auth-helpers-nextjs"

// TODO: add @lib
import { Database } from "@/lib/supabase/database.types"

export const createServerClient = () =>
  createServerComponentSupabaseClient<Database>({
    headers,
    cookies,
  })
