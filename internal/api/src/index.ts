import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"

import { type AppRouter, appRouter } from "./routes"
import { type Context, createCallerFactory, createInnerTRPCContext, createTRPCContext } from "./trpc"

export { t } from "./trpc"
export { ratelimit } from "./utils/upstash"

export type { AppRouter } from "./routes"

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
const createCaller = createCallerFactory(appRouter)

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>

export { appRouter, createCaller, createInnerTRPCContext, createTRPCContext }
export type { Context }

