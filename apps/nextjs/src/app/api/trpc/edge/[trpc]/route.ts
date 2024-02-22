// export { handler as GET, handler as POST }

import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { edgeRouter } from "@builderai/api/edge"
import { auth } from "@builderai/auth/server"

import { CorsOptions, setCorsHeaders } from "../../../_enableCors"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

const handler = auth(async (req) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc/edge",
    router: edgeRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        session: req.auth,
        req,
      }),
    onError: ({ error, path }) => {
      console.log("❌ Error in tRPC handler (edge) on path", path)
      console.error(error)
    },
  })

  setCorsHeaders(response)
  return response
})

export { handler as GET, CorsOptions as OPTIONS, handler as POST }
