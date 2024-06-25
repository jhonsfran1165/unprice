import { transformer } from "@builderai/api/transformer"
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query"
import { TRPCClientError } from "@trpc/client"
import { toastAction } from "~/lib/toast"

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""
  const vc = process.env.VERCEL_URL
  if (vc) return `https://${vc}`
  return "http://localhost:3000"
}

// lambdas keys must match the first part of the path
export const lambdas = ["ingestion"]

export const createQueryClient = (isClient = false) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Since queries are prefetched on the server, we set a stale time so that
        // queries aren't immediately refetched on the client
        staleTime: 1000 * 30,
      },
      ...(isClient
        ? {
            mutations: {
              onError: (err) => {
                console.error(err)

                if (err instanceof TRPCClientError) {
                  toastAction("error", err.message)
                } else {
                  toastAction("error-contact")
                }
              },
            },
          }
        : {}),
      dehydrate: {
        // include pending queries in dehydration
        // this allows us to prefetch in RSC and
        // send promises over the RSC boundary
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: {
        // when the promise has resolved, deserialize the data
        // since trpc will serialize it on the server. this
        // allows you to return Date, Temporal etc from your
        // procedure and have that auto-serialize on the client
        transformPromise: (promise) => promise.then(transformer.deserialize),
      },
    },
  })
