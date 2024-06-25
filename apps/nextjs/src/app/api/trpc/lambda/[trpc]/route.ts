import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { lambdaRouter } from "@builderai/api/lambda"
import { auth } from "@builderai/auth/server"

// import { setCorsHeaders } from "~/app/api/_enableCors"

export const preferredRegion = ["fra1"]
export const runtime = "nodejs"

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
      console.info("❌  Error in tRPC handler (lambda) on path", path)
      console.error(error)
    },
  })

  return response
})

export { handler as GET, handler as POST }
