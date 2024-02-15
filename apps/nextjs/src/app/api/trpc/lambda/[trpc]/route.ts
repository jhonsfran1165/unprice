import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { lambdaRouter } from "@builderai/api/lambda"
import { auth } from "@builderai/auth/server"

import { setCorsHeaders } from "~/app/api/_enableCors"

export const preferredRegion = ["fra1"]
export const runtime = "nodejs"

const handler = auth(async (req) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc/edge",
    router: lambdaRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        session: req.auth,
      }),
    onError: ({ error, path }) => {
      console.log("❌  Error in tRPC handler (lambda) on path", path)
      console.error(error)
    },
  })

  setCorsHeaders(response)
  return response
})

export { handler as GET, handler as POST }
