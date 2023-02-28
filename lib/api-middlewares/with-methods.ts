import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"

export default function withMethods(
  methods: string[],
  handler: NextApiHandler
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (!methods.includes(req.method)) {
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
    return handler(req, res)
  }
}
