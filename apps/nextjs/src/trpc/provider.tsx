"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental"
import { loggerLink } from "@trpc/client"
import superjson from "superjson"

import { apiRQ } from "./client"
import { endingLink, transformer } from "./shared"

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
    apiRQ.createClient({
      transformer,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLink({
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
    <apiRQ.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryStreamedHydration transformer={superjson}>
          {props.children}
        </ReactQueryStreamedHydration>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </apiRQ.Provider>
  )
}
