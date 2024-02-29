import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"

import type { AppRouter } from "./root"
import { appRouter } from "./root"
import {
  createCallerFactory,
  createInnerTRPCContext,
  createTRPCContext,
} from "./trpc"

export { t } from "./trpc"

export type { AppRouter } from "./root"

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
