/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import type { NextRequest } from "next/server"
import type { OpenApiMeta } from "@potatohd/trpc-openapi"
import { initTRPC, TRPCError } from "@trpc/server"
import { ZodError } from "zod"

import type { Session } from "@builderai/auth/server"
import { auth } from "@builderai/auth/server"
import { db, eq, schema } from "@builderai/db"

import { transformer } from "./transformer"
import { projectGuard } from "./utils"
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
interface CreateContextOptions {
  headers: Headers
  session: Session | null
  apiKey?: string | null
  req?: NextRequest
  activeWorkspaceSlug: string
  activeProjectSlug: string
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 *
 * Examples of things you may need it for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    ...opts,
    db: db,
    // INFO: better wait for native support for RLS in Drizzle
    // txRLS: rls.authTxn(db, opts.session?.user.id),
  }
}

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers
  session: Session | null
  req?: NextRequest
}) => {
  const session = opts.session ?? (await auth())
  const userId = session?.user?.id ?? "unknown"
  const apiKey = opts.headers.get("x-builderai-api-key")
  const source = opts.headers.get("x-trpc-source") ?? "unknown"

  // for client side we set a httpOnly cookie from middleware
  // for server side we set a header from trpc invoker
  const activeWorkspaceSlug =
    opts.req?.cookies.get("workspace-slug")?.value ??
    opts.headers.get("workspace-slug") ??
    ""

  // for client side we set a httpOnly cookie from middleware
  // for server side we set a header from trpc invoker
  // TODO: use utils here
  const activeProjectSlug =
    opts.req?.cookies.get("project-slug")?.value ??
    opts.headers.get("project-slug") ??
    ""

  console.log(
    ">>> tRPC Request from",
    source,
    "by",
    userId,
    "workspace",
    activeWorkspaceSlug,
    "project",
    activeProjectSlug
  )

  return createInnerTRPCContext({
    session,
    apiKey,
    headers: opts.headers,
    req: opts.req,
    activeWorkspaceSlug,
    activeProjectSlug,
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
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      }
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
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure

/**
 * Reusable procedure that enforces users are logged in before running the
 * procedure
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        userId: ctx.session?.user.id,
      },
    },
  })
})

export const protectedWorkspaceProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    // TODO: use utils here
    const activeWorkspaceSlug = ctx.activeWorkspaceSlug

    if (!activeWorkspaceSlug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active workspace in the session",
      })
    }

    const workspaces = ctx.session?.user?.workspaces
    const activeWorkspace = workspaces?.find(
      (workspace) => workspace.slug === activeWorkspaceSlug
    )

    if (!activeWorkspace) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          "Workspace not found or you don't have access to the workspace",
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
  }
)

export const protectedWorkspaceAdminProcedure = protectedWorkspaceProcedure.use(
  ({ ctx, next }) => {
    ctx.verifyRole(["OWNER", "ADMIN"])

    return next({
      ctx,
    })
  }
)

export const protectedWorkspaceOwnerProcedure = protectedWorkspaceProcedure.use(
  ({ ctx, next }) => {
    ctx.verifyRole(["OWNER"])

    return next({
      ctx,
    })
  }
)

export const protectedProjectProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
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
  }
)

export const protectedProjectAdminProcedure = protectedProjectProcedure.use(
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
export const protectedApiProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.apiKey) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // Check db for API key
  // TODO: prepare a statement for this
  const apiKey = await ctx.db.query.apikeys.findFirst({
    columns: {
      id: true,
      projectId: true,
      key: true,
    },
    where: (apikey, { sql }) =>
      sql`${apikey.key} = ${ctx.apiKey} AND ${apikey.revokedAt} is NULL`,
  })

  if (!apiKey?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  void ctx.db
    .update(schema.apikeys)
    .set({
      lastUsed: new Date(),
    })
    .where(eq(schema.apikeys.id, apiKey.id))

  return next({
    ctx: {
      apiKey,
    },
  })
})

/**
 * Procedure to parse form data and put it in the rawInput and authenticate requests with an API key
 */
export const protectedApiFormDataProcedure = protectedApiProcedure.use(
  async function formData(opts) {
    const formData = await opts.ctx.req?.formData?.()
    if (!formData) throw new TRPCError({ code: "BAD_REQUEST" })

    return opts.next({
      input: formData,
    })
  }
)
/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
