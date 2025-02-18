import "server-only"

import { cache } from "react"
import { auth } from "./server"

/**
 * This is the main way to get session data for your RSCs.
 * This will de-duplicate all calls to next-auth's default `auth()` function and only call it once per request
 */
export const getSession = cache(async () => {
  const session = await auth()

  if (!session) return null

  return session
})
