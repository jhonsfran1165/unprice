"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental"
import type {
  HTTPBatchStreamLinkOptions,
  HTTPHeaders,
  TRPCLink,
} from "@trpc/react-query"
import {
  createTRPCReact,
  loggerLink,
  unstable_httpBatchStreamLink,
} from "@trpc/react-query"

import type { AppRouter } from "@builderai/api"

import { getBaseUrl, lambdas, transformer } from "./shared"

export const api = createTRPCReact<AppRouter>()

export const endingLinkClient = (opts?: {
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

export function TRPCReactProvider(props: {
  children: React.ReactNode
  headers?: Headers
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.TRPC_LOGGER === "true" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLinkClient({
          headers: () => {
            const headers = new Map(props.headers)
            headers.set("x-trpc-source", "nextjs-react")
            return Object.fromEntries(headers)
          },
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration transformer={transformer}>
          {props.children}
        </ReactQueryStreamedHydration>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </api.Provider>
  )
}
