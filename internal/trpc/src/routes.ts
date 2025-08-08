import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import { edgeEndpoints } from "./router/edge"
import { edgeRouter } from "./router/edge"
import { lambdaEndpoints } from "./router/lambda"
import { lambdaRouter } from "./router/lambda"
import { createTRPCRouter, mergeRouters } from "./trpc"

const lambdaEndProcedures = Object.keys(lambdaRouter._def.procedures).map((key) => key)
const edgeEndProcedures = Object.keys(edgeRouter._def.procedures).map((key) => key)

// endpoints list like namespace.procedure -> customer.list
export const allEndpointsProcedures = {
  lambda: lambdaEndProcedures,
  edge: edgeEndProcedures,
}

// bit of a hack to split the endpoints in two and merge them later
const { customers: customersEdge, ...restEdgeEndpoints } = edgeEndpoints
const { customers: customersLambda, ...restLambdaEndpoints } = lambdaEndpoints

// customer is duplicate in both routers, we need to merge them before creating the router
// edge customer endpoints read cache most of the time so better to have them in edge
const customersRouter = createTRPCRouter({
  customers: mergeRouters(customersLambda, customersEdge),
})

// Used to provide a good DX with a single client
// Then, a custom link is used to generate the correct URL for the request in the client
export const appRouter = mergeRouters(
  createTRPCRouter(restEdgeEndpoints),
  createTRPCRouter(restLambdaEndpoints),
  customersRouter
)

export type AppRouter = typeof appRouter

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
