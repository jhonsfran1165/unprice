import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  // withRateLimit,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"

const validMethods = ["GET", "POST", "PUT", "DELETE"]

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session,
  profile?: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("project")
        .select("*")
        .eq("id", req.query.projectId)
        .eq("org_id", req.query.orgId)
        .single()

      if (error) return res.status(404).json({ ...error })

      return res.status(200).json({ ...data })
    }

    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("project")
        .select("*")
        .eq("id", req.body.projectId)

      if (error) return res.status(404).json({ ...error })

      return res.status(200).json({ ...data })
    }
  } catch (error) {
    return res.status(500).json({ ...error })
  }
}

export default withAuthentication(handler, {
  protectedMethods: ["POST", "DELETE", "PUT", "GET"],
  needProfileDetails: true,
})
