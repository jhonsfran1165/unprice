import "server-only"

import { cookies, headers } from "next/headers"
import { cache } from "react"

import { createHydrationHelpers } from "@trpc/react-query/rsc"
import { TRPCError } from "@trpc/server"
import { type appRouter, createCaller, createTRPCContext } from "@unprice/api"
import { getSession } from "@unprice/auth/server-rsc"
import { COOKIES_APP } from "@unprice/config"
import { createQueryClient } from "./shared"

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers())
  const activeWorkspaceSlug = cookies().get(COOKIES_APP.WORKSPACE)?.value ?? ""
  const activeProjectSlug = cookies().get(COOKIES_APP.PROJECT)?.value ?? ""

  heads.set("x-trpc-source", "rsc")
  heads.set(COOKIES_APP.WORKSPACE, activeWorkspaceSlug)
  heads.set(COOKIES_APP.PROJECT, activeProjectSlug)

  return createTRPCContext({
    session: await getSession(),
    headers: heads,
  })
})

/**
 * Create a stable getter for the query client that
 * will return the same client during the same request.
 */
const getQueryClient = cache(createQueryClient)

export const api = createCaller(createContext, {
  onError: (opts) => {
    if (opts.error instanceof TRPCError) {
      throw new Error(
        JSON.stringify({
          code: opts.error.code,
          message: opts.error.message,
        })
      )
    }

    throw opts.error
  },
})

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(api, getQueryClient)
