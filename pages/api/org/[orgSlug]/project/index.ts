import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  // withRateLimit,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { projectCreateSchema } from "@/lib/validations/project"

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

      const { data: projects, error } = await supabase
        .from("project")
        .select("*, organization!inner(*)")
        .eq("organization.slug", orgSlug)

      if (error) return res.status(404).json(error)

      return res.status(200).json(projects)
    }

    if (req.method === "POST") {
      const { orgSlug } = req.query

      const { data: projects, error } = await supabase
        .from("project")
        .select("*, organization!inner(*)")
        .eq("organization.slug", orgSlug)

      if (error) return res.status(404).json(error)

      return res.status(200).json(projects)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["GET", "POST"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      POST: projectCreateSchema,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(handler, {
      protectedMethods: ["POST", "GET"],
      needProfileDetails: true,
    })
  )
)
