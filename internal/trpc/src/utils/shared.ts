import { TRPCError } from "@trpc/server"
import { Unprice } from "@unprice/api"
import { members, workspaces } from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import type { WorkspaceInsert } from "@unprice/db/validators"
import { CustomerService } from "@unprice/services/customers"
import uuid from "uuid-random"
import { env } from "#env"
import type { Context } from "#trpc"

export const getEntitlements = async ({
  customerId,
  ctx,
  projectId,
}: {
  customerId: string
  ctx: Context
  projectId: string
}) => {
  const now = performance.now()
  const customer = new CustomerService({
    db: ctx.db,
    logger: ctx.logger,
    analytics: ctx.analytics,
    waitUntil: ctx.waitUntil,
    cache: ctx.cache,
    metrics: ctx.metrics,
  })

  const entitlements = await customer.getActiveEntitlements({
    customerId,
    projectId,
    now,
  })

  return entitlements
}

// abstract the usage reporting to the feature service
// so we can use the same logic for edge and lambda endpoints
export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  usage,
  isMain,
}: {
  customerId: string
  featureSlug: string
  usage: number
  isMain?: boolean
}) => {
  // if the feature is main, we don't need to report usage
  if (isMain) {
    return {
      success: true,
    }
  }

  const unprice = new Unprice({
    token: env.UNPRICE_API_KEY,
    baseUrl: "https://api.unprice.dev",
  })

  const { result, error } = await unprice.customers.reportUsage({
    customerId,
    featureSlug,
    usage,
    idempotenceKey: uuid(),
  })

  if (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.code,
    })
  }

  return result
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
  const { name, unPriceCustomerId, isInternal, id, isPersonal } = input
  const user = ctx.session?.user

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User not found",
    })
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

  const customer = new CustomerService(ctx)

  const { err, val } = await customer.signOut({
    customerId: customerId,
    projectId: projectId,
  })

  if (err) {
    return {
      success: false,
      message: err.message,
    }
  }

  return val
}
