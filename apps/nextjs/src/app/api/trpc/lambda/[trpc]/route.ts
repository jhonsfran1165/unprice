import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { auth } from "@unprice/auth/server"
import { createTRPCContext } from "@unprice/trpc"
import { lambdaRouter } from "@unprice/trpc/router/lambda"

import { CorsOptions, setCorsHeaders } from "~/app/api/_enableCors"

export const preferredRegion = ["fra1"]
export const runtime = "nodejs"
export const maxDuration = 10 // 10 seconds

const handler = auth(async (req) => {
  // when we use the middleware to rewrite the request, the path doesn't include the /api prefix
  // trpc under the hood uses the path to determine the procedure
  const pathName = req.nextUrl.pathname
  const endpoint = pathName.startsWith("/api") ? "/api/trpc/lambda" : "/trpc/lambda"

  const response = await fetchRequestHandler({
    endpoint: endpoint,
    router: lambdaRouter,
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

      console.info("❌  Error in tRPC handler (lambda) on path", path)
    },
  })

  setCorsHeaders(response)
  return response
})

export { handler as GET, CorsOptions as OPTIONS, handler as POST }
