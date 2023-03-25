import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  // withRateLimit,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import {
  orgBySlugPostSchema,
  orgCreatePostSchema,
  orgProfileGetSchema,
} from "@/lib/validations/org"

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
        .from("organization_profiles")
        .select("*, organization(*)")
        .eq("profile_id", profile?.id)

      if (error) return res.status(404).json(error)

      return res.status(200).json(data)
    }

    if (req.method === "POST") {
      const { slug } = req.body

      const { data } = await supabase
        .from("organization")
        .select("slug")
        .eq("slug", slug)
        .single()

      return res.status(200).json(data)
    }

    if (req.method === "PUT") {
      const { slug, type, name, image } = req.body

      const { data: org, error } = await supabase
        .from("organization")
        .insert({
          slug,
          type,
          name,
          image,
        })
        .select()
        .single()

      // TODO: clean null in types
      await supabase.from("organization_profiles").insert({
        org_id: org?.id,
        profile_id: profile?.id,
        role: "owner",
        is_default: false,
      })

      if (error) return res.status(404).json(error)

      return res.status(200).json(org)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["GET", "POST", "PUT"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      GET: orgProfileGetSchema,
      POST: orgBySlugPostSchema,
      PUT: orgCreatePostSchema,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(
      // ratelimit only GET endpoint because is public
      // withRateLimit(handler, "sites", ["GET"]),
      handler,
      {
        protectedMethods: ["GET", "POST", "PUT"],
        needProfileDetails: true,
      }
    )
  )
)
