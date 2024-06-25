import "server-only"

import { cookies, headers } from "next/headers"
import { cache } from "react"

import { type appRouter, createCaller, createTRPCContext } from "@builderai/api"
import { getSession } from "@builderai/auth/server-rsc"
import { COOKIE_NAME_PROJECT, COOKIE_NAME_WORKSPACE } from "@builderai/config"
import { createHydrationHelpers } from "@trpc/react-query/rsc"
import { createQueryClient } from "./shared"

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers())
  const activeWorkspaceSlug = cookies().get(COOKIE_NAME_WORKSPACE)?.value ?? ""
  const activeProjectSlug = cookies().get(COOKIE_NAME_PROJECT)?.value ?? ""

  heads.set("x-trpc-source", "rsc")
  heads.set(COOKIE_NAME_WORKSPACE, activeWorkspaceSlug)
  heads.set(COOKIE_NAME_PROJECT, activeProjectSlug)

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

export const api = createCaller(createContext)

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(api, getQueryClient)
