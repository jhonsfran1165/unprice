"use client"

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { TRPCLink } from "@trpc/client"
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client"
import type { HTTPBatchStreamLinkOptions, HTTPHeaders } from "@trpc/react-query"
import { createTRPCReact } from "@trpc/react-query"
import type { AnyRootTypes } from "@trpc/server/unstable-core-do-not-import"
import { useState } from "react"

import type { AppRouter } from "@unprice/api"
import { transformer } from "@unprice/api/transformer"
import { createQueryClient, getBaseUrl } from "./shared"

export const api = createTRPCReact<AppRouter>()

export const endingLinkClient = (opts?: {
  headers?: HTTPHeaders | (() => HTTPHeaders)
  lambdaEndProcedures: string[]
}) =>
  ((runtime) => {
    const sharedOpts: Partial<HTTPBatchStreamLinkOptions<AnyRootTypes>> = {
      headers: opts?.headers,
    }

    const edgeLink = unstable_httpBatchStreamLink({
      ...sharedOpts,
      transformer: transformer,
      url: `${getBaseUrl()}/api/trpc/edge`,
    })(runtime)

    const lambdaLink = unstable_httpBatchStreamLink({
      ...sharedOpts,
      transformer: transformer,
      url: `${getBaseUrl()}/api/trpc/lambda`,
    })(runtime)

    return (ctx) => {
      const path = ctx.op.path.split(".") as [string, ...string[]]
      // TODO: improve this
      const endpoint = opts?.lambdaEndProcedures.includes(ctx.op.path) ? "lambda" : "edge"

      const newCtx = {
        ...ctx,
        op: { ...ctx.op, path: path.join(".") },
      }
      return endpoint === "edge" ? edgeLink(newCtx) : lambdaLink(newCtx)
    }
  }) satisfies TRPCLink<AppRouter>

let clientQueryClientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  }

  // Browser: use singleton pattern to keep the same query client
  clientQueryClientSingleton ??= createQueryClient()
  return clientQueryClientSingleton
}

export function TRPCReactProvider(props: {
  children: React.ReactNode
  lambdaEndProcedures: string[]
}) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.TRPC_LOGGER === "true" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLinkClient({
          headers: { "x-trpc-source": "react-query" },
          lambdaEndProcedures: props.lambdaEndProcedures,
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </api.Provider>
  )
}
