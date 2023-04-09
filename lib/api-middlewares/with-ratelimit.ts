import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"

import { ratelimit } from "@/lib/upstash"

export default function withRateLimit(
  handler: NextApiHandler,
  key: string,
  methods?: [string]
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (methods?.includes(req.method ?? "") || methods === undefined) {
      const { success } = await ratelimit.limit(key)

      if (!success) {
        return res.status(429).json({
          error: "ratelimit",
          description: "Don't DDoS me pls 🥺",
        })
      }
    }

    return handler(req, res)
  }
}
