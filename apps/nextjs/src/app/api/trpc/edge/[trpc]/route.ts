import type { NextRequest } from "next/server"
// export { handler as GET, handler as POST }

import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { createTRPCContext } from "@builderai/api"
import { edgeRouter } from "@builderai/api/edge"
import { getAuth } from "@builderai/auth/server"

import { CorsOptions, setCorsHeaders } from "../../../_enableCors"

export const runtime = "edge"
export const preferredRegion = ["fra1"]

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
    auth: getAuth(req),
    req,
  })
}

const handler = async (req: NextRequest) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc/edge",
    router: edgeRouter,
    req,
    createContext: () => createContext(req),
    onError: ({ error, path }) => {
      console.log("Error in tRPC handler (edge) on path", path)
      console.error(error)
    },
  })

  setCorsHeaders(response)
  return response
}

export { handler as GET, CorsOptions as OPTIONS, handler as POST }
