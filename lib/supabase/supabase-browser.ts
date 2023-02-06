import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"

import { Database } from "@/lib/supabase/database.types"

export const createBrowserClient = () => createBrowserSupabaseClient<Database>()
