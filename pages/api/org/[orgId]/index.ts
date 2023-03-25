import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  // withRateLimit,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { orgGetSchama } from "@/lib/validations/org"

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session,
  profile?: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "GET") {
      // get all project of this organization
      const { data, error } = await supabase
        .from("organization")
        .select("*")
        .eq("id", req.query.orgId)

      if (error) return res.status(404).json(error)

      return res.status(200).json(data)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["GET"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      GET: orgGetSchama,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(
      // ratelimit only GET endpoint because is public
      // withRateLimit(handler, "sites", ["GET"]),
      handler,
      {
        protectedMethods: ["GET"],
        needProfileDetails: true,
      }
    )
  )
)
