import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import {
  orgPostSchema,
  orgProfileGetSchema,
  orgPutSchema,
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
      const { id, slug, type, name, image, description } = req.body

      const { data: org, error } = await supabase
        .from("organization")
        .update({
          type,
          name,
          image,
          description,
        })
        .eq("id", id)
        .eq("slug", slug)
        .select()
        .single()

      if (error) return res.status(404).json(error)

      return res.status(200).json(org)
    }

    if (req.method === "PUT") {
      // TODO: use postgres functions instead
      // https://github.com/supabase/postgrest-js/issues/237#issuecomment-739537955

      const { data: orgProfiles } = await supabase
        .from("organization_profiles")
        .select("is_default")
        .eq("profile_id", profile?.id)
        .eq("is_default", true)
        .single()

      const { slug, type, name, image, description } = req.body

      const { data: org, error } = await supabase
        .from("organization")
        .insert({
          slug,
          type,
          name,
          image,
          description,
        })
        .select()
        .single()

      if (error) return res.status(404).json(error)

      if (profile?.id && org?.id) {
        await supabase.from("organization_profiles").insert({
          org_id: org.id,
          profile_id: profile.id,
          role: "owner",
          is_default: !orgProfiles?.is_default,
        })
      } else {
        return res
          .status(404)
          .json({ error: "Something went wrong! Try again!" })
      }

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
      POST: orgPostSchema,
      PUT: orgPutSchema,
    },
    // validate session for ["POST", "DELETE", "PUT"] endpoints only
    withAuthentication(handler, {
      protectedMethods: ["GET", "POST", "PUT"],
      needProfileDetails: true,
    })
  )
)
