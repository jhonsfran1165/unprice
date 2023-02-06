import { NextApiRequest, NextApiResponse } from "next"
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"
import * as z from "zod"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createServerSupabaseClient({
      req,
      res,
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // const user = session?.user

    // const body = req.body

    // console.log(session)

    const { data } = await supabase.from("site").select("*")
    return res.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json(error.issues)
    }

    return res.status(422).end()
  }
}
