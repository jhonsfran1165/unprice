import { NextApiRequest, NextApiResponse } from "next"
import cloudinary from "cloudinary"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { orgDeleteSchema, orgGetSchema } from "@/lib/validations/org"

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

      const { data: dataOrg, error } = await supabase
        .from("data_orgs")
        .select("*")
        .eq("profile_id", session?.user.id)
        .eq("org_slug", orgSlug)
        .single()

      if (error) return res.status(404).json(error)

      return res.status(200).json(dataOrg)
    }

    if (req.method === "DELETE") {
      const { orgSlug, id } = req.body

      const { data: deletedOrg, error } = await supabase
        .from("organization")
        .delete()
        .eq("id", id)
        .eq("slug", orgSlug)
        .select("image")
        .single()

      // TODO: delete cloudinary url
      // cloudinary.v2.uploader.destroy(deletedOrg?.image)

      if (error) return res.status(404).json(error)

      return res.status(200).json({})
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["GET", "DELETE"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  // validate payload for this methods
  withValidation(
    {
      GET: orgGetSchema,
      DELETE: orgDeleteSchema,
    },
    withAuthentication(handler, {
      protectedMethods: ["GET", "DELETE"],
      needProfileDetails: true,
    })
  )
)
