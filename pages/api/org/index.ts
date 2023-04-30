import { NextApiRequest, NextApiResponse } from "next"
import { v4 as uuidv4 } from "uuid"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import supabaseAdmin from "@/lib/supabase/supabase-admin"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import {
  orgGetSchema,
  orgPostSchema,
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
      const { data, error } = await supabase
        .from("data_orgs")
        .select("*")
        .eq("profile_id", session?.user.id)

      if (error) return res.status(404).json(error)

      return res.status(200).json(data)
    }

    if (req.method === "POST") {
      const { id, type, name, image, description } = req.body

      const { data: org, error } = await supabase
        .from("organization")
        .update({
          type,
          name,
          image,
          description,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) return res.status(500).json(error)

      return res.status(200).json(org)
    }

    if (req.method === "PUT") {
      const { slug, type, name, image, description } = req.body
      const uuid = uuidv4()

      const { data: dasdasd } = await supabase.auth.getSession()

      console.log(dasdasd)
      // we use here admin supabase to bypass all RLS
      const { data, error } = await supabaseAdmin.rpc("config_org", {
        user_id: session?.user.id ?? "",
        org_id: uuid,
        slug,
        type: type.toUpperCase(),
        name,
        image,
        description,
        role_user: "OWNER",
        tier: "FREE",
        is_default: true,
      })

      console.log(error)

      if (error) return res.status(500).json(error)

      return res.status(200).json({ slug: slug })
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
      GET: orgGetSchema,
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
