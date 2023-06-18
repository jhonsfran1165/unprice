import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { orgChangeRoleSchema } from "@/lib/validations/org"

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session,
  profile?: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "POST") {
      const { id, role, profileId } = req.body

      // every organization has to have at least one owner
      const { data: findRoles } = await supabase
        .from("organization_profiles")
        .select("profile_id")
        .eq("org_id", id)
        .eq("role", "OWNER")

      if (!findRoles) {
        return res.status(404).json({
          error: {
            message: "This organization has no owner. Contact support.",
          },
        })
      }

      if (findRoles.length === 1 && findRoles[0].profile_id === profileId) {
        return res.status(500).json({
          error: {
            message:
              "This profile is the only owner in the organization. Every organization has to have at least one owner.",
          },
        })
      }

      const { data, error } = await supabase
        .from("organization_profiles")
        .update({ role: role })
        .eq("profile_id", profileId)
        .eq("org_id", id)
        .select("org_id")
        .single()

      if (error) return res.status(500).json({ error })

      if (!data) return res.status(404).json({})
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
      POST: orgChangeRoleSchema,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(handler, {
      protectedMethods: ["POST"],
      needProfileDetails: true,
    })
  )
)
