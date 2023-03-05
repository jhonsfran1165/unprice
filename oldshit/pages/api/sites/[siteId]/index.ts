import { NextApiRequest, NextApiResponse } from "next"

import {
  withAuthentication,
  withMethods,
  // withRateLimit,
  withValidation,
} from "@/lib/api-middlewares"
import { supabaseApiClient } from "@/lib/supabase/supabase-api"
import { Profile, Session } from "@/lib/types/supabase"
import { siteCreateSchema, siteGetSchema } from "@/lib/validations/site"

const validMethods = ["GET", "POST", "PUT", "DELETE"]

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
        .from("site")
        .select("*")
        .eq("id", req.query.siteId)
        .single()

      console.log(data)

      if (error) return res.status(404).json({ ...error })

      return res.status(200).json({ ...data })
    }

    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("site")
        .select("*")
        .eq("id", req.body.siteId)

      if (error) return res.status(404).json({ ...error })

      return res.status(200).json({ ...data })
    }
  } catch (error) {
    return res.status(500).json({ ...error })
  }
}

// export default withMethods(
//   // valid methods for this endpoint
//   validMethods,
//   // validate payload for this endpoint
//   withValidation(
//     {
//       GET: siteGetSchema,
//       PUT: siteCreateSchema,
//       POST: siteCreateSchema,
//       DELETE: siteCreateSchema,
//     },
//     // validate session for ["POST", "DELETE", "PUT"] endpoints only
//     withAuthentication(
//       // ratelimit only GET endpoint because is public
//       // withRateLimit(handler, "sites", ["GET"]),
//       handler,
//       {
//         protectedMethods: ["POST", "DELETE", "PUT"],
//         needProfileDetails: false,
//       }
//     )
//   )
// )

export default withAuthentication(
  // ratelimit only GET endpoint because is public
  // withRateLimit(handler, "sites", ["GET"]),
  handler,
  {
    protectedMethods: ["POST", "DELETE", "PUT", "GET"],
    needProfileDetails: true,
  }
)
