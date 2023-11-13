import { headers } from "next/headers"
import type {
  HTTPBatchStreamLinkOptions,
  HTTPHeaders,
  TRPCLink,
} from "@trpc/client"
import {
  createTRPCClient,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/client"

import type { AppRouter } from "@builderai/api"

import { getBaseUrl, lambdas, transformer } from "./shared"

export const endingLinkServer = (opts?: {
  headers?: HTTPHeaders | (() => HTTPHeaders)
}) =>
  ((runtime) => {
    const sharedOpts = {
      headers: opts?.headers,
    } satisfies Partial<HTTPBatchStreamLinkOptions>

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

export const api = createTRPCClient<AppRouter>({
  transformer,
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    endingLinkServer({
      headers: () => {
        const h = new Map(headers())
        h.delete("connection")
        h.delete("transfer-encoding")
        h.set("x-trpc-source", "server")

        console.log(h.entries())
        return Object.fromEntries(h.entries())
      },
    }),
  ],
})

export { type RouterInputs, type RouterOutputs } from "@builderai/api"

// export const createCaller = cache(async () =>
//   appRouter.createCaller(await createTRPCContext({})),
// ); //Probably don't use this one

// export const helpers = createServerSideHelpers({
//   router: appRouter,
//   ctx: await createTRPCContext({}),
//   transformer, // optional - adds superjson serialization
// });
//Apparently, this one is only for preftch and fetch. It's for dehidrating to the cache I believe.
//Let's not use this for now. To actually call procedures from the server, please use createTRPCProxyClient({}) -- https://trpc.io/docs/server/server-side-calls
