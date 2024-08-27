import { ratelimit } from "@unprice/api"
import { auth } from "@unprice/auth/server"
import { ipAddress } from "@vercel/edge"
import type { NextRequest } from "next/server"

export const ratelimitOrThrow = async (req: NextRequest, identifier?: string) => {
  // Rate limit if user is not logged in
  const session = await auth()
  if (!session?.user) {
    const ip = ipAddress(req)
    const { success } = await ratelimit(100, "10 s").limit(`${identifier || "ratelimit"}:${ip}`)
    if (!success) {
      throw new Error("Don't DDoS me pls 🥺")
    }
  }
}
