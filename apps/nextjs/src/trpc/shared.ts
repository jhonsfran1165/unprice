import type { HTTPBatchLinkOptions, HTTPHeaders, TRPCLink } from "@trpc/client"
import { unstable_httpBatchStreamLink } from "@trpc/client"

import type { AppRouter } from "@builderai/api"

export { transformer } from "@builderai/api/transformer"

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""
  const vc = process.env.VERCEL_URL
  if (vc) return `https://${vc}`
  return `http://localhost:3000`
}

// lambdas keys must match the first part of the path
const lambdas = ["stripe", "ingestion"]

export const endingLink = (opts?: {
  headers?: HTTPHeaders | (() => HTTPHeaders)
}) =>
  ((runtime) => {
    const sharedOpts = {
      headers: opts?.headers,
    } satisfies Partial<HTTPBatchLinkOptions>

    const edgeLink = unstable_httpBatchStreamLink({
      ...sharedOpts,
      url: `${getBaseUrl()}/api/trpc/edge`,
    })(runtime)
    const lambdaLink = unstable_httpBatchStreamLink({
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
