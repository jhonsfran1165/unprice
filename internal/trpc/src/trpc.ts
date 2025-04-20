import { tracing } from "@baselime/trpc-opentelemetry-middleware"
import type { Session } from "@unprice/auth/server"
import "server-only"
import { TRPCError, initTRPC } from "@trpc/server"
import type { Cache as C } from "@unkey/cache"
import type { NextAuthRequest } from "@unprice/auth"
import { auth } from "@unprice/auth/server"
import { COOKIES_APP } from "@unprice/config"
import type { Database, TransactionDatabase } from "@unprice/db"
import { db } from "@unprice/db"
import { newId } from "@unprice/db/utils"
import { BaseLimeLogger, ConsoleLogger, type Logger } from "@unprice/logging"
import type { CacheNamespaces } from "@unprice/services/cache"
import { CacheService } from "@unprice/services/cache"
import { LogdrainMetrics, type Metrics, NoopMetrics } from "@unprice/services/metrics"
import { Analytics } from "@unprice/tinybird"
import { waitUntil } from "@vercel/functions"
import { ZodError } from "zod"
import { fromZodError } from "zod-validation-error"
import { env } from "./env"
import { transformer } from "./transformer"
import { projectWorkspaceGuard } from "./utils"
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
  ip: string
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 */
export const createInnerTRPCContext = (
  opts: CreateContextOptions
): CreateContextOptions & {
  db: Database | TransactionDatabase
  analytics: Analytics
} => {
  return {
    ...opts,
    db: db,
    analytics: new Analytics({
      tinybirdToken: env.TINYBIRD_TOKEN,
      tinybirdUrl: env.TINYBIRD_URL,
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

  const authorizationHeader = opts.headers.get("Authorization") || ""
  const apikey = authorizationHeader.split(" ")[1]

  const source = opts.headers.get("unprice-request-source") || "unknown"
  const pathname = opts.req?.nextUrl.pathname || "unknown"
  const requestId = opts.headers.get("unprice-request-id") || newId("request")
  const region = opts.headers.get("x-vercel-id") || "unknown"
  const country = opts.headers.get("x-vercel-ip-country") || "unknown"
  const userAgent = opts.headers.get("user-agent") || "unknown"

  const ip =
    opts.headers.get("x-real-ip") ||
    opts.headers.get("x-forwarded-for") ||
    opts.req?.ip ||
    "127.0.0.1"

  const logger = env.EMIT_METRICS_LOGS
    ? new BaseLimeLogger({
        apiKey: env.BASELIME_APIKEY,
        requestId,
        defaultFields: { userId, region, country, source, ip, pathname, userAgent },
        namespace: "unprice-trpc",
        dataset: "unprice-trpc",
        service: "trpc", // default service name
        flushAfterMs: 3000, // flush after 3 secs
        ctx: {
          waitUntil, // flush will be executed as a background task
        },
        environment: env.NODE_ENV,
        application: "trpc",
      })
    : new ConsoleLogger({
        requestId,
        environment: env.NODE_ENV,
        application: "trpc",
        defaultFields: { userId, region, country, source, ip, pathname },
      })

  const metrics: Metrics = env.EMIT_METRICS_LOGS
    ? new LogdrainMetrics({ requestId, logger, environment: env.NODE_ENV, application: "trpc" })
    : new NoopMetrics()

  const cacheService = new CacheService(
    {
      waitUntil,
    },
    metrics,
    env.EMIT_METRICS_LOGS
  )

  await cacheService.init()

  const cache = cacheService.getCache()

  // this comes from the cookies or headers of the request
  const activeWorkspaceSlug =
    opts.req?.cookies.get(COOKIES_APP.WORKSPACE)?.value ??
    opts.headers.get(COOKIES_APP.WORKSPACE) ??
    ""

  const activeProjectSlug =
    opts.req?.cookies.get(COOKIES_APP.PROJECT)?.value ?? opts.headers.get(COOKIES_APP.PROJECT) ?? ""

  return createInnerTRPCContext({
    session,
    ip,
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
export const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer,
  errorFormatter({ shape, error, ctx }) {
    // don't show stack trace in production
    if (env.NODE_ENV === "production") {
      delete error.stack
      delete shape.data.stack
    }

    const errorResponse = {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
        cause: error.cause,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
      message:
        error.cause instanceof ZodError ? fromZodError(error.cause).toString() : error.message,
    }

    // log the error if it's an internal server error
    if (error.code === "INTERNAL_SERVER_ERROR") {
      ctx?.logger.error("Error 500 in trpc api", {
        error: JSON.stringify(errorResponse),
      })
    }

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
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found in session" })
  }

  if (!ctx.session?.user?.email) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found in session" })
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
// if the workspaceSlug is in the input, use it, otherwise use the active workspace slug in the cookie
export const protectedWorkspaceProcedure = protectedProcedure.use(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as { workspaceSlug?: string }
    const activeWorkspaceSlug = input?.workspaceSlug ?? ctx.activeWorkspaceSlug

    const data = await workspaceGuard({
      workspaceSlug: activeWorkspaceSlug,
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
  }
)

export const protectedProjectProcedure = protectedProcedure.use(
  async ({ ctx, next, getRawInput }) => {
    const input = (await getRawInput()) as { projectSlug?: string }
    const activeProjectSlug = input?.projectSlug ?? ctx.activeProjectSlug ?? undefined

    // if projectSlug is present, use it if not use the active project slug
    const data = await projectWorkspaceGuard({
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
  }
)

/**
 * Procedure to parse form data and put it in the rawInput and authenticate requests with an API key
 */
export const protectedApiFormDataProcedure = protectedProcedure.use(async function formData(opts) {
  const data = await opts.ctx.req?.formData?.()
  if (!formData) throw new TRPCError({ code: "BAD_REQUEST" })

  return opts.next({
    input: data,
  })
})

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
