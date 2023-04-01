import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
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
      const { orgSlug } = req.query

      const { data: orgsProfile, error } = await supabase
        .from("organization_profiles")
        .select("*, organization!inner(*)")
        .eq("profile_id", session?.user.id)
        .eq("organization.slug", orgSlug)
        .single()

      if (error) return res.status(404).json(error)

      return res.status(200).json(orgsProfile)
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
    withAuthentication(handler, {
      protectedMethods: ["GET"],
      needProfileDetails: true,
    })
  )
)
