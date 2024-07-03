import "server-only"
import { tracing } from "@baselime/trpc-opentelemetry-middleware"
import type { Session } from "@builderai/auth/server"

import type { OpenApiMeta } from "@potatohd/trpc-openapi"
import { TRPCError, initTRPC } from "@trpc/server"
import { ZodError } from "zod"

import type { NextAuthRequest } from "@builderai/auth"
import { auth } from "@builderai/auth/server"
import { COOKIE_NAME_PROJECT, COOKIE_NAME_WORKSPACE } from "@builderai/config"
import { db } from "@builderai/db"
import { newId } from "@builderai/db/utils"
import { BaseLimeLogger, ConsoleLogger, type Logger } from "@builderai/logging"
import { Analytics } from "@builderai/tinybird"
import type { Cache as C } from "@unkey/cache"
import { waitUntil } from "@vercel/functions"
import { env } from "./env.mjs"
import { initCache } from "./pkg/cache"
import type { CacheNamespaces } from "./pkg/cache/namespaces"
import { type Metrics, NoopMetrics } from "./pkg/metrics"
import { LogdrainMetrics } from "./pkg/metrics/logdrain"
import { transformer } from "./transformer"
import { projectGuard } from "./utils"
import { apikeyGuard } from "./utils/apaikey-guard"
import { workspaceGuard } from "./utils/workspace-guard"

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */
export interface CreateContextOptions {
  headers: Headers
  session: Session | null
  apikey?: string | null
  req?: NextAuthRequest
  activeWorkspaceSlug: string
  activeProjectSlug: string
  requestId: string
  logger: Logger
  metrics: Metrics
  cache: C<CacheNamespaces>
  // pass this in the context so we can migrate easily to other providers
  waitUntil: (p: Promise<unknown>) => void
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    ...opts,
    db: db,
    analytics: new Analytics({
      tinybirdToken: env.TINYBIRD_TOKEN,
      emit: env.EMIT_ANALYTICS,
    }),
    // INFO: better wait for native support for RLS in Drizzle
    // txRLS: rls.authTxn(db, opts.session?.user.id),
  }
}

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 */
export const createTRPCContext = async (opts: {
  headers: Headers
  session: Session | null
  req?: NextAuthRequest
}) => {
  const session = opts.session ?? (await auth())
  const userId = session?.user?.id ?? "unknown"
  const apikey = opts.headers.get("x-builderai-api-key")
  const source = opts.headers.get("x-trpc-source") ?? "unknown"
  const requestId = opts.headers.get("x-request-id") ?? newId("request")
  const region = opts.headers.get("x-vercel-id") ?? "unknown"
  const country = opts.headers.get("x-vercel-ip-country") ?? "unknown"

  const logger = env.EMIT_METRICS_LOGS
    ? new BaseLimeLogger({
        apiKey: env.BASELIME_APIKEY,
        requestId,
        defaultFields: { userId, region, country, source },
        namespace: "unprice-api",
        dataset: "unprice-api",
        service: "api", // default service name
        flushAfterMs: 3000, // flush after 3 secs
        ctx: {
          waitUntil, // flush will be executed as a background task
        },
      })
    : new ConsoleLogger({
        requestId,
        defaultFields: { userId, region, country, source },
      })

  const metrics: Metrics = env.EMIT_METRICS_LOGS
    ? new LogdrainMetrics({ requestId, logger })
    : new NoopMetrics()

  const cache = await initCache(
    {
      waitUntil,
    },
    metrics
  )

  // this comes from the cookies or headers of the request
  const activeWorkspaceSlug =
    opts.req?.cookies.get(COOKIE_NAME_WORKSPACE)?.value ??
    opts.headers.get(COOKIE_NAME_WORKSPACE) ??
    ""

  const activeProjectSlug =
    opts.req?.cookies.get(COOKIE_NAME_PROJECT)?.value ?? opts.headers.get(COOKIE_NAME_PROJECT) ?? ""

  return createInnerTRPCContext({
    session,
    apikey,
    headers: opts.headers,
    req: opts.req,
    activeWorkspaceSlug,
    activeProjectSlug,
    requestId,
    logger,
    metrics,
    cache,
    waitUntil, // abstracted to allow migration to other providers
  })
}

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
// TODO: support Authorization header https://www.npmjs.com/package/@potatohd/trpc-openapi#authorization
export const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer,
    errorFormatter({ shape, error, ctx }) {
      const errorResponse = {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === "BAD_REQUEST" && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      }

      ctx?.logger.error("Error in trpc api", {
        error: JSON.stringify(errorResponse),
      })

      return errorResponse
    },
  })

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router
export const mergeRouters = t.mergeRouters

/**
 * Public procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(tracing({ collectInput: true }))

/**
 * Reusable procedure that enforces users are logged in before running the
 * procedure
 */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      userId: ctx.session?.user.id,
      session: {
        ...ctx.session,
      },
    },
  })
})

// this is a procedure that requires a user to be logged in and have an active workspace
// it also sets the active workspace in the context
// the active workspace is passed in the headers or cookies of the request
export const protectedActiveWorkspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const activeWorkspaceSlug = ctx.activeWorkspaceSlug

  if (!activeWorkspaceSlug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active workspace in the session",
    })
  }

  const workspaces = ctx.session?.user?.workspaces
  const activeWorkspace = workspaces?.find((workspace) => workspace.slug === activeWorkspaceSlug)

  if (!activeWorkspace) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Workspace not found or you don't have access to the workspace",
    })
  }

  const data = await workspaceGuard({
    workspaceId: activeWorkspace?.id,
    ctx,
  })

  return next({
    ctx: {
      ...data,
      session: {
        ...ctx.session,
      },
    },
  })
})

export const protectedActiveWorkspaceAdminProcedure = protectedActiveWorkspaceProcedure.use(
  ({ ctx, next }) => {
    ctx.verifyRole(["OWNER", "ADMIN"])

    return next({
      ctx,
    })
  }
)

export const protectedActiveWorkspaceOwnerProcedure = protectedActiveWorkspaceProcedure.use(
  ({ ctx, next }) => {
    ctx.verifyRole(["OWNER"])

    return next({
      ctx,
    })
  }
)

// for those endpoint that are used inside the app but they also can be used with an api key
export const protectedApiOrActiveProjectProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const activeProjectSlug = ctx.activeProjectSlug
  const apikey = ctx.apikey

  // Check db for API key if apiKey is present
  if (apikey) {
    const { apiKey } = await apikeyGuard({
      apikey,
      ctx,
    })

    return next({
      ctx: {
        // pass the project data to the context to ensure all changes are applied to the correct project
        project: apiKey.project,
        apiKey: apiKey,
      },
    })
  }

  // if no api key is present, check if the user is logged in
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" })
  }

  const data = await projectGuard({
    projectSlug: activeProjectSlug,
    ctx,
  })

  return next({
    ctx: {
      userId: ctx.session?.user.id,
      ...data,
      session: {
        ...ctx.session,
      },
    },
  })
})

export const protectedActiveProjectProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const activeProjectSlug = ctx.activeProjectSlug

  const data = await projectGuard({
    projectSlug: activeProjectSlug,
    ctx,
  })

  return next({
    ctx: {
      ...data,
      session: {
        ...ctx.session,
      },
    },
  })
})

export const protectedActiveProjectAdminProcedure = protectedActiveProjectProcedure.use(
  ({ ctx, next }) => {
    ctx.verifyRole(["OWNER", "ADMIN"])

    return next({
      ctx,
    })
  }
)

/**
 * Procedure to authenticate API requests with an API key
 */
export const protectedApiProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const apikey = ctx.apikey

  const { apiKey } = await apikeyGuard({
    apikey,
    ctx,
  })

  return next({
    ctx: {
      apiKey: apiKey,
    },
  })
})

/**
 * Procedure to parse form data and put it in the rawInput and authenticate requests with an API key
 */
export const protectedApiFormDataProcedure = protectedApiProcedure.use(
  async function formData(opts) {
    const data = await opts.ctx.req?.formData?.()
    if (!formData) throw new TRPCError({ code: "BAD_REQUEST" })

    return opts.next({
      input: data,
    })
  }
)

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
