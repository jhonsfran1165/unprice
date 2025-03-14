"use client"

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { TRPCLink } from "@trpc/client"
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { use, useState } from "react"

import type { AppRouter } from "@unprice/api"
import { transformer } from "@unprice/api/transformer"
import { newId } from "@unprice/db/utils"
import { useSSROnlySecret } from "ssr-only-secrets"
import { createQueryClient, getBaseUrl } from "./shared"

export const api = createTRPCReact<AppRouter>()

export const endingLinkClient = (opts?: {
  allEndpointsProcedures: {
    lambda: string[]
    edge: string[]
  }
  cookies: string | undefined
}) =>
  ((runtime) => {
    const headers = {
      "unprice-request-id": newId("request"),
      "unprice-request-source": typeof window !== "undefined" ? "app-react-query" : "app-react-query-ssr",
      ...(opts?.cookies ? { cookie: opts.cookies } : {}),
    }

    const edgeLink = unstable_httpBatchStreamLink({
      headers,
      transformer: transformer,
      url: `${getBaseUrl()}/api/trpc/edge`,
    })(runtime)

    const lambdaLink = unstable_httpBatchStreamLink({
      headers,
      transformer: transformer,
      url: `${getBaseUrl()}/api/trpc/lambda`,
    })(runtime)

    return (ctx) => {
      const path = ctx.op.path.split(".") as [string, ...string[]]
      // this is a bit of a hack, but it works for now
      // we try to infer the endpoint based on the path
      // and split the endpoint to the given runtime
      const endpoint = opts?.allEndpointsProcedures.lambda.includes(ctx.op.path) ? "lambda" : "edge"

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
  cookiePromise: Promise<string>
  allEndpointsProcedures: {
    lambda: string[]
    edge: string[]
  }
}) {
  const queryClient = getQueryClient()
  const cookies = useSSROnlySecret(use(props.cookiePromise), "COOKIE_ENCRYPTION_KEY")

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.TRPC_LOGGER === "true" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLinkClient({
          allEndpointsProcedures: props.allEndpointsProcedures,
          cookies: cookies,
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
