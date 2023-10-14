"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { apiRQ } from "./client"
import { endingLink, transformer } from "./shared"

export function ReactQueryProvider(props: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      })
  )

  const [trpcClient] = useState(
    apiRQ.createClient({
      transformer,
      links: [
        endingLink({
          headers: {
            "x-trpc-source": "client",
          },
        }),
      ],
    })
  )

  return (
    <apiRQ.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
        {<ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </apiRQ.Provider>
  )
}
