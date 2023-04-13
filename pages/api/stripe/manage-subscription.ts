import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  withValidation,
} from "@/lib/api-middlewares"
import { stripe } from "@/lib/stripe"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Organization, Profile, Session } from "@/lib/types/supabase"
import { getAppRootUrl } from "@/lib/utils"
import { orgPostSchema } from "@/lib/validations/stripe"

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  session?: Session,
  profile?: Profile
) {
  try {
    const supabase = supabaseApiClient(req, res)

    if (req.method === "POST") {
      const { orgSlug } = req.body

      const { data: orgsProfile, error } = await supabase
        .from("organization_profiles")
        .select("*, organization!inner(*)")
        .eq("profile_id", session?.user.id)
        .eq("organization.slug", orgSlug)
        .single()

      const org = orgsProfile?.organization as Organization

      const { url } = await stripe.billingPortal.sessions.create({
        customer: org?.stripeId || "",
        return_url: `${getAppRootUrl()}/org/${orgSlug}/settings`,
      })

      if (error) return res.status(404).json(error)

      return res.status(200).json(url)
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
      POST: orgPostSchema,
    },
    withAuthentication(handler, {
      protectedMethods: ["POST"],
      needProfileDetails: true,
    })
  )
)
