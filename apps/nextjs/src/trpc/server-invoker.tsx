import { headers } from "next/headers"
import { createTRPCClient, loggerLink } from "@trpc/client"
import { experimental_nextCacheLink } from "@trpc/next/app-dir/links/nextCache"

import type { AppRouter } from "@builderai/api"
import { appRouter } from "@builderai/api/root"
import { auth } from "@builderai/auth"
import { activateRLS, authTxn, db, deactivateRLS } from "@builderai/db"

import { transformer } from "./shared"

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const api = createTRPCClient<AppRouter>({
  transformer,
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.TRPC_LOGGER === "true" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    experimental_nextCacheLink({
      // requests are cached for 5 seconds
      revalidate: 5,
      router: appRouter,
      // eslint-disable-next-line @typescript-eslint/require-await
      createContext: async () => {
        const authObj = auth()
        const { userId, orgId } = authObj
        const tenantId = orgId ?? userId ?? ""
        const apiKey = headers().get("x-builderai-api-key")

        console.log(
          ">>> tRPC Request from",
          "server-invoker",
          "by",
          userId,
          "to",
          headers().get("next-url")
        )

        return {
          auth: authObj,
          tenantId,
          apiKey,
          db,
          // db helpers for emulating RLS
          txRLS: authTxn(db, tenantId),
          // these two increase the number of times you call your db
          activateRLS: activateRLS(db, tenantId),
          deactivateRLS: deactivateRLS(db),
        }
      },
    }),
  ],
})
