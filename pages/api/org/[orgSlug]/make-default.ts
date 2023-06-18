import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { orgMakeDefaultSchema } from "@/lib/validations/org"

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session,
  profile?: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "POST") {
      const { id, is_default } = req.body

      const { error: updateDefault } = await supabase
        .from("organization_profiles")
        .update({ is_default: false })
        .eq("profile_id", session?.user.id)

      const { data, error: newDefault } = await supabase
        .from("organization_profiles")
        .update({ is_default: is_default })
        .eq("profile_id", session?.user.id)
        .eq("org_id", id)
        .select("org_id")
        .single()

      if (newDefault || updateDefault)
        return res.status(404).json({ ...updateDefault, ...newDefault })

      return res.status(200).json(data)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["POST"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      POST: orgMakeDefaultSchema,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(handler, {
      protectedMethods: ["POST"],
      needProfileDetails: true,
    })
  )
)
