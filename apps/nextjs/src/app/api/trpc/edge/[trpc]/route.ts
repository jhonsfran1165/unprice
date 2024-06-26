// export { handler as GET, handler as POST }

import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { edgeRouter } from "@builderai/api/edge"
import { auth } from "@builderai/auth/server"

import { CorsOptions, setCorsHeaders } from "../../../_enableCors"

// TODO: vercel is having trouble with the runtime edge so for now we are using nodejs
export const runtime = "nodejs"
export const preferredRegion = ["fra1"]

const handler = auth(async (req) => {
  // when we use the middleware to rewrite the request, the path doesn't include the /api prefix
  // trpc under the hood uses the path to determine the procedure
  const pathName = req.nextUrl.pathname
  const endpoint = pathName.startsWith("/api") ? "/api/trpc/edge" : "/trpc/edge"

  const response = await fetchRequestHandler({
    endpoint: endpoint,
    router: edgeRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        session: req.auth,
        req,
      }),
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        // TODO: send to bug reporting
        console.error("Something went wrong", error)
      }

      console.info("❌  Error in tRPC handler (edge) on path", path)
      console.error(error)
    },
    // TODO: handling cache headers for public routes
    // https://trpc.io/docs/server/caching
  })

  setCorsHeaders(response)
  return response
})

export { handler as GET, CorsOptions as OPTIONS, handler as POST }
