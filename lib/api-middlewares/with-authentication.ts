import type { NextApiRequest, NextApiResponse } from "next"

import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"

interface WithAuthenticationNextApiHandler {
  (
    req: NextApiRequest,
    res: NextApiResponse,
    session?: Session,
    profile?: Profile
  ): Promise<void>
}

export default function withAuthentication(
  handler: WithAuthenticationNextApiHandler,
  {
    protectedMethods, // protected methods for authentication by default all methods are protected
    needProfileDetails, // if the action needs the user's profile details
    needOrgDetails, // if the action needs the org details
  }: {
    protectedMethods?: string[]
    needProfileDetails?: boolean
    needOrgDetails?: boolean
  } = {}
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (
      protectedMethods?.includes(req.method ?? "") ||
      protectedMethods === undefined
    ) {
      const supabase = supabaseApiClient(req, res)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return res.status(401).json({
          error: "not_authenticated",
          description:
            "The user does not have an active session or is not authenticated",
        })
      }

      if (needProfileDetails) {
        const { data: profile, error } = await supabase
          .from("profile")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) return res.status(404).json(error)

        return handler(req, res, session, profile)
      }

      // TODO: see if this is a good idea?
      // if (needOrgDetails) {
      //   // get all project of this organization
      //   const { data: orgsProfile, error } = await supabase
      //     .from("organization_profiles")
      //     .select("*, organization(*)")
      //     .eq("profile_id", session.user.id)

      //   if (error) return res.status(404).json(error)

      //   return handler(req, res, session, profile, orgsProfile)
      // }

      return handler(req, res)
    }
  }
}