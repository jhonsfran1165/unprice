import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import * as z from "zod"
import type { ZodSchema } from "zod"

export default function withValidation<T extends ZodSchema>(
  validations: { [methods: string]: T },
  handler: NextApiHandler
) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    try {
      // only validate if the schema is passed
      if (validations[req.method]) {
        let body = req.body ? req.body : {}

        if (req.method === "GET") {
          body = req.query ? req.query : {}
        }

        const schema = validations[req.method]

        await schema.parse(body)
      }

      return handler(req, res)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json(error.issues)
      }

      return res.status(422).end()
    }
  }
}
