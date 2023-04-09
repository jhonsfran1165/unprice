import type { NextApiRequest, NextApiResponse } from "next"
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"

import { Database } from "@/lib/types/database.types"

export const supabaseApiClient = (req: NextApiRequest, res: NextApiResponse) =>
  createServerSupabaseClient<Database>({
    req,
    res,
  })
