import { TRPCError } from "@trpc/server"
import type { Database, TransactionDatabase } from "@unprice/db"
import { members, workspaces } from "@unprice/db/schema"
import { createSlug, newId } from "@unprice/db/utils"
import type { WorkspaceInsert } from "@unprice/db/validators"
import { CustomerService } from "@unprice/services/customers"
import uuid from "uuid-random"
import type { Context } from "#trpc"
import { unprice } from "./unprice"

// abstract the usage reporting to the feature service
// so we can use the same logic for edge and lambda endpoints
export const reportUsageFeature = async ({
  customerId,
  featureSlug,
  usage,
  isMain,
  metadata,
}: {
  customerId: string
  featureSlug: string
  usage: number
  isMain?: boolean
  metadata?: Record<string, string | undefined>
}) => {
  // if the feature is main, we don't need to report usage
  if (isMain) {
    return {
      success: true,
    }
  }

  try {
    const { result, error } = await unprice.customers.reportUsage({
      customerId,
      featureSlug,
      usage,
      idempotenceKey: uuid(),
      metadata,
    })

    if (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.code,
      })
    }

    return result
  } catch (e) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: e instanceof Error ? e.message : "Error checking feature access",
    })
  }
}

export const createWorkspace = async ({
  input,
  db,
  userId,
}: {
  input: WorkspaceInsert
  db: Database | TransactionDatabase
  userId: string
}) => {
  const { name, unPriceCustomerId, isInternal, id, isPersonal } = input

  const user = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  })

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User not found",
    })
  }

  // TODO: use sdk to verify if the customer exists
  const customer = await db.query.customers.findFirst({
    where: (customer, { eq }) => eq(customer.id, unPriceCustomerId),
  })

  if (!customer) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Customer unprice not found",
    })
  }

  // get the subscription of the customer
  const subscription = await db.query.subscriptions.findFirst({
    where: (subscription, { eq }) => eq(subscription.customerId, unPriceCustomerId),
  })

  if (!subscription) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Subscription not found",
    })
  }

  const newWorkspace = await db.transaction(async (tx) => {
    const slug = createSlug()

    // look if the workspace already has a customer
    const workspaceExists = await db.query.workspaces.findFirst({
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
