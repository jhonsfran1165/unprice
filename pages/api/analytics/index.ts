import { NextApiRequest, NextApiResponse } from "next"

import { withMethods } from "@/lib/api-middlewares"
import { getPageHits } from "@/lib/tinybird"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // TODO: testing pipedata
    if (req.method === "GET") {
      const data = await getPageHits({})
      return res.status(200).json(data)
    }
  } catch (error) {
    return res.status(500).json(error)
  }
}

const validMethods = ["GET"]

export default withMethods(
  // valid methods for this endpoint
  validMethods,
  handler
)
