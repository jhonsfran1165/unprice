import type { NextRequest } from "next/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { lambdaRouter } from "@builderai/api/lambda"
import { getAuth } from "@builderai/auth/server"

export const preferredRegion = ["fra1"]
export const runtime = "nodejs"

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
    auth: getAuth(req),
    req,
  })
}

// Stripe is incompatible with Edge runtimes due to using Node.js events

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc/lambda",
    router: lambdaRouter,
    req: req,
    createContext: () => createContext(req),
    onError: ({ error, path }) => {
      console.log("Error in tRPC handler (lambda) on path", path)
      console.error(error)
    },
  })

export { handler as GET, handler as POST }
