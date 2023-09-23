/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import type { NextRequest } from "next/server"
import type { inferAsyncReturnType } from "@trpc/server"
import { initTRPC, TRPCError } from "@trpc/server"
import { ZodError } from "zod"

import type {
  SignedInAuthObject,
  SignedOutAuthObject,
} from "@builderai/auth/api"
import { getAuth } from "@builderai/auth/server"
import { activateRLS, authTxn, db, deactivateRLS, eq } from "@builderai/db"
import { apikey } from "@builderai/db/schema"

import { transformer } from "./transformer"

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
  auth: SignedInAuthObject | SignedOutAuthObject | null
  apiKey?: string | null
  req?: NextRequest
  tenantId: string // clerk tenant id asociated to the workspace
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
    db,
    // db helpers for emulating RLS
    txRLS: authTxn(db, opts.tenantId),
    // these two increase the number of times you call your db
    activateRLS: activateRLS(db, opts.tenantId),
    deactivateRLS: deactivateRLS(db),
  }
}

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = (opts: { req: NextRequest }) => {
  const auth = getAuth(opts.req)
  const { userId, orgId } = auth
  const apiKey = opts.req.headers.get("x-builderai-api-key")
  const tenantId = orgId ?? userId ?? ""

  return createInnerTRPCContext({
    auth,
    tenantId,
    apiKey,
    req: opts.req,
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
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
      },
    },
  })
})

const enforceOrg = enforceUserIsAuthed.unstable_pipe(async ({ ctx, next }) => {
  // You need to create a custom claim inside the session from Clerk
  const orgs = ctx.auth.sessionClaims?.activeOrgs as Record<string, string>

  // if there is no orgId then is a personal user account
  // so no need to raise and error
  if (ctx.auth.orgId && !orgs[ctx.auth.orgId]) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be in the organization to perform this action",
    })
  }

  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        orgId: ctx.auth.orgId,
      },
    },
  })
})

const enforceOrgAdmin = enforceOrg.unstable_pipe(async ({ ctx, next }) => {
  // You need to create a custom claim inside the session from Clerk
  const orgs = ctx.auth.sessionClaims?.activeOrgs as Record<string, string>

  if (ctx.auth.orgId && orgs[ctx.auth.orgId] !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "You must be an admin of this organization to perform this action",
    })
  }

  return next({
    ctx: {
      auth: {
        ...ctx.auth,
        orgRole: ctx.auth.orgRole,
      },
    },
  })
})

/**
 * Middleware to authenticate API requests with an API key
 */
const enforceApiKey = t.middleware(async ({ ctx, next }) => {
  if (!ctx.apiKey) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // Check db for API key
  const apiKey = await ctx.db.query.apikey.findFirst({
    columns: {
      id: true,
      projectId: true,
      key: true,
    },
    where: (apikey, { sql }) =>
      sql`${apikey.key} = ${ctx.apiKey} AND ${apikey.revokedAt} is NULL`,
  })

  if (!apiKey) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // TODO: I don't know rick - improve this
  void ctx.db
    .update(apikey)
    .set({
      lastUsed: new Date(),
    })
    .where(eq(apikey.id, apiKey.id))

  return next({
    ctx: {
      apiKey,
    },
  })
})

/**
 * Middleware to parse form data and put it in the rawInput
 */
export const formdataMiddleware = t.middleware(async (opts) => {
  const formData = await opts.ctx.req?.formData?.()
  if (!formData) throw new TRPCError({ code: "BAD_REQUEST" })

  return opts.next({
    rawInput: formData,
  })
})
/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
export const protectedOrgProcedure = t.procedure.use(enforceOrg)
export const protectedOrgAdminProcedure = t.procedure.use(enforceOrgAdmin)

export const protectedApiProcedure = t.procedure.use(enforceApiKey)
export const protectedApiFormDataProcedure = t.procedure
  .use(formdataMiddleware)
  .use(enforceApiKey)

export type Context = inferAsyncReturnType<typeof createTRPCContext>
