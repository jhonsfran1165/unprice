import { TRPCError } from "@trpc/server"
import { type Database, and, eq, sql } from "@unprice/db"
import { members, workspaces } from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import type { WorkspaceInsert } from "@unprice/db/validators"
import { CustomerService, UnPriceCustomerError } from "@unprice/services/customers"
import type { Context } from "../trpc"

// shared logic for some procedures
// this way I use my product to build my product
// without setting up unprice sdk
export const verifyEntitlement = async ({
  customerId,
  featureSlug,
  projectId,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  ctx: Context
}) => {
  const now = performance.now()
  const customer = new CustomerService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // use current date for now
  const date = Date.now()

  const { err, val } = await customer.verifyEntitlement({
    customerId,
    featureSlug,
    projectId,
    date,
  })

  const end = performance.now()

  ctx.metrics.emit({
    metric: "metric.feature.verification",
    duration: end - now,
    customerId,
    featureSlug,
    valid: !err,
    code: err?.code ?? "",
    service: "customer",
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const getEntitlements = async ({
  customerId,
  projectId,
  ctx,
  includeCustom = true,
  updateUsage = true,
  noCache = false,
}: {
  customerId: string
  projectId: string
  ctx: Context
  includeCustom?: boolean
  updateUsage?: boolean
  noCache?: boolean
}) => {
  const customer = new CustomerService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // use current date for now
  const now = Date.now()

  const { err, val } = await customer.getEntitlementsByDate({
    customerId,
    projectId,
    date: now,
    includeCustom,
    // update usage from analytics service on revalidation
    updateUsage,
    noCache,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error verifying entitlements",
        })
    }
  }

  return val
}

// abstract the usage reporting to the feature service
// so we can use the same logic for edge and lambda endpoints
export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  projectId,
  usage,
  ctx,
}: {
  customerId: string
  featureSlug: string
  projectId: string
  workspaceId: string
  usage: number
  ctx: Context
}) => {
  const customer = new CustomerService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  // use current date for now but we could support reporting usage for past dates
  const now = Date.now()

  const { err, val } = await customer.reportUsage({
    customerId,
    featureSlug,
    projectId,
    usage,
    date: now,
  })

  if (err) {
    switch (true) {
      case err instanceof UnPriceCustomerError:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.code,
        })
      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error verifying feature: ${err.toString()}`,
        })
    }
  }

  return val
}

export const createWorkspace = async ({
  input,
  ctx,
}: {
  input: WorkspaceInsert & {
    unPriceCustomerId: string
    name: string
  }
  ctx: Context
}) => {
  const { name, unPriceCustomerId, isInternal, id } = input
  const user = ctx.session?.user

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User not found",
    })
  }

  let isPersonal = true

  // verify if the user is a member of any workspace
  const countMembers = await ctx.db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(and(eq(members.userId, user.id)))
    .then((res) => res[0]?.count ?? 0)

  // if the user is a member of any workspace, the workspace is not personal
  if (countMembers > 0) {
    isPersonal = false
  }

  // verify if the customer exists
  const customer = await ctx.db.query.customers.findFirst({
    where: (customer, { eq }) => eq(customer.id, unPriceCustomerId),
  })

  if (!customer) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Customer unrpice not found",
    })
  }

  // get the subscription of the customer
  const subscription = await ctx.db.query.subscriptions.findFirst({
    where: (subscription, { eq }) => eq(subscription.customerId, unPriceCustomerId),
  })

  if (!subscription) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Subscription not found",
    })
  }

  const newWorkspace = await ctx.db.transaction(async (tx) => {
    const slug = createSlug()

    // look if the workspace already has a customer
    const workspaceExists = await ctx.db.query.workspaces.findFirst({
      where: (workspace, { eq }) => eq(workspace.unPriceCustomerId, unPriceCustomerId),
    })

    let workspaceId = ""
    let workspace = undefined

    if (!workspaceExists?.id) {
      // create the workspace
      workspace = await tx
        .insert(workspaces)
        .values({
          id: id ?? newId("workspace"),
          slug: slug,
          name: name,
          imageUrl: user.image,
          isPersonal: isPersonal ?? false,
          isInternal: isInternal ?? false,
          createdBy: user.id,
          unPriceCustomerId: unPriceCustomerId,
          plan: subscription.planSlug,
        })
        .returning()
        .then((workspace) => {
          return workspace[0] ?? undefined
        })
        // TODO: use this method to throw errors in all api endpoints
        .catch((err) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          })
        })

      if (!workspace?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error creating workspace",
        })
      }

      workspaceId = workspace.id
    } else {
      workspaceId = workspaceExists.id
      workspace = workspaceExists
    }

    // verify if the user is already a member of the workspace
    const member = await tx.query.members.findFirst({
      where: (member, { eq, and }) =>
        and(eq(member.workspaceId, workspaceId), eq(member.userId, user.id)),
    })

    // if so don't create a new member
    if (member) {
      return workspace
    }

    const memberShip = await tx
      .insert(members)
      .values({
        userId: user.id,
        workspaceId: workspaceId,
        role: "OWNER",
      })
      .returning()
      .then((members) => members[0] ?? null)
      .catch((err) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        })
      })

    if (!memberShip?.userId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating member",
      })
    }

    return workspace
  })

  return newWorkspace
}

export const signOutCustomer = async ({
  input,
  ctx,
}: {
  input: { customerId: string; projectId: string }
  ctx: Context
}) => {
  const { customerId, projectId } = input

  const customer = new CustomerService({
    cache: ctx.cache,
    db: ctx.db as Database,
    analytics: ctx.analytics,
    logger: ctx.logger,
    metrics: ctx.metrics,
    waitUntil: ctx.waitUntil,
  })

  const { err, val } = await customer.signOut({
    customerId: customerId,
    projectId: projectId,
  })

  if (err) {
    return {
      success: false,
      url: "",
      customerId: "",
      error: err.message,
    }
  }

  return val
}
