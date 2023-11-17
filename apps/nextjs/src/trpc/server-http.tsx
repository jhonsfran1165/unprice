import { headers } from "next/headers"
import type {
  HTTPBatchStreamLinkOptions,
  HTTPHeaders,
  TRPCLink,
} from "@trpc/client"
import { loggerLink } from "@trpc/client"
import { experimental_nextHttpLink } from "@trpc/next/app-dir/links/nextHttp"
import { experimental_createTRPCNextAppDirServer } from "@trpc/next/app-dir/server"

import type { AppRouter } from "@builderai/api"

import { getBaseUrl, lambdas, transformer } from "./shared"

export const endingLinkServer = (opts?: {
  headers?: HTTPHeaders | (() => HTTPHeaders)
}) =>
  ((runtime) => {
    const sharedOpts = {
      headers: opts?.headers,
    } satisfies Partial<HTTPBatchStreamLinkOptions>

    const edgeLink = experimental_nextHttpLink({
      ...sharedOpts,
      url: `${getBaseUrl()}/api/trpc/edge`,
    })(runtime)

    const lambdaLink = experimental_nextHttpLink({
      ...sharedOpts,
      url: `${getBaseUrl()}/api/trpc/lambda`,
    })(runtime)

    return (ctx) => {
      const path = ctx.op.path.split(".") as [string, ...string[]]
      const endpoint = lambdas.includes(path[0]) ? "lambda" : "edge"

      const newCtx = {
        ...ctx,
        op: { ...ctx.op, path: path.join(".") },
      }
      return endpoint === "edge" ? edgeLink(newCtx) : lambdaLink(newCtx)
    }
  }) satisfies TRPCLink<AppRouter>

export const api = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      transformer,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.TRPC_LOGGER === "true" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        endingLinkServer({
          headers: () => {
            const h = new Map(headers())
            h.delete("connection")
            h.delete("transfer-encoding")
            h.set("x-trpc-source", "server-http")

            return Object.fromEntries(h.entries())
          },
        }),
      ],
    }
  },
})
