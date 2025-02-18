import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query"
import { TRPCClientError } from "@trpc/client"
import { transformer } from "@unprice/api/transformer"
import { getErrorMessage } from "~/lib/handle-error"
import { toastAction } from "~/lib/toast"

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""
  const vc = process.env.VERCEL_URL
  if (vc) return `https://${vc}`
  return "http://localhost:3000"
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Since queries are prefetched on the server, we set a stale time so that
        // queries aren't immediately refetched on the client
        staleTime: 1000 * 30,
      },
      mutations:
        typeof window === "undefined"
          ? {
              onError: (err) => {
                // TODO: log this error
                console.error(err)
              },
            }
          : {
              onError: (err) => {
                const error = getErrorMessage(err)

                if (err instanceof TRPCClientError) {
                  toastAction("error", err.message)
                } else {
                  toastAction("error-contact", error)
                }
              },
            },
      dehydrate: {
        // include pending queries in dehydration
        // this allows us to prefetch in RSC and
        // send promises over the RSC boundary
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        serializeData: transformer.serialize,
      },
      hydrate: {
        deserializeData: transformer.deserialize,
      },
      // dehydrate: {
      //   // include pending queries in dehydration
      //   // this allows us to prefetch in RSC and
      //   // send promises over the RSC boundary
      //   shouldDehydrateQuery: (query) =>
      //     defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      // },
      // hydrate: {
      //   // @ts-expect-error - https://github.com/TanStack/query/pull/7615
      //   transformData: (data) => (data ? transformer.deserialize(data) : data),
      //   // when the promise has resolved, deserialize the data
      //   // since trpc will serialize it on the server. this
      //   // allows you to return Date, Temporal etc from your
      //   // procedure and have that auto-serialize on the client
      //   transformPromise: (promise: Promise<SuperJSONResult>) =>
      //     promise.then(transformer.deserialize),
      // },
    },
  })
