import { APP_DOMAIN } from "@unprice/config"
import { type Database, type TransactionDatabase, and, db, eq } from "@unprice/db"
import * as schema from "@unprice/db/schema"
import * as utils from "@unprice/db/utils"
import { createSlug, newId } from "@unprice/db/utils"
import type { User, Workspace, WorkspaceInsert } from "@unprice/db/validators"
import { BaseError, Err, Ok, type Result, SchemaError } from "@unprice/error"
import bcrypt from "bcryptjs"
import { unprice } from "./unprice"

export class UnPriceAuthError extends BaseError {
  public readonly retry = false
  public readonly name = UnPriceAuthError.name

  constructor({ message }: { message: string }) {
    super({
      message: `${message}`,
    })
  }
}

export async function createUser({
  email,
  password,
  confirmPassword,
  name,
  image,
  emailVerified,
}: {
  email: string
  password?: string
  confirmPassword?: string
  name: string
  emailVerified: Date | null
  image?: string
}): Promise<Result<User, UnPriceAuthError | SchemaError>> {
  if (password !== confirmPassword) {
    return Err(new SchemaError({ message: "Passwords do not match" }))
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null

  try {
    const user = await db
      .insert(schema.users)
      .values({
        email,
        name,
        image,
        password: hashedPassword,
        // use our own id generator
        id: utils.newId("user"),
        // only true if we use auth providers like github, google, etc
        emailVerified,
      })
      .onConflictDoUpdate({
        target: [schema.users.email],
        set: {
          name,
          image,
          password: hashedPassword,
          emailVerified,
        },
      })
      .returning()
      .then((user) => user[0] ?? null)

    if (!user) {
      return Err(new UnPriceAuthError({ message: `Error creating user for ${email}` }))
    }

    // check if the user has an invite
    const inviteUser = await db.query.invites.findFirst({
      where: (invite, { eq, and, isNull }) =>
        and(eq(invite.email, user.email), isNull(invite.acceptedAt)),
    })

    if (inviteUser) {
      // add the user as a member of the workspace
      await db
        .insert(schema.members)
        .values({
          userId: user.id,
          workspaceId: inviteUser.workspaceId,
          role: inviteUser.role,
        })
        .onConflictDoNothing()

      // update the invite as accepted
      await db
        .update(schema.invites)
        .set({
          acceptedAt: Date.now(),
        })
        .where(
          and(
            eq(schema.invites.email, inviteUser.email),
            eq(schema.invites.workspaceId, inviteUser.workspaceId)
          )
        )
    }

    const workspaceId = newId("workspace")
    // Don't create workspace if the user is invited to another workspace ?
    // 1. create customer in unprice with the latest version of the free plan
    const { error: errCustomer, result: customer } = await unprice.customers.signUp({
      email: user.email,
      name: user.name ?? user.email.split("@")[0]!,
      planSlug: "FREE",
      successUrl: `${APP_DOMAIN}`,
      cancelUrl: `${APP_DOMAIN}`,
      externalId: workspaceId,
    })

    if (errCustomer) {
      return Err(new UnPriceAuthError({ message: errCustomer.message }))
    }

    // 2. create a personal workspace for the user
    const { err } = await createWorkspace({
      input: {
        id: workspaceId,
        name: user.name ?? user.email.split("@")[0]!,
        unPriceCustomerId: customer.customerId,
        isInternal: false,
        isPersonal: true,
      },
      db,
      userId: user.id,
    })

    if (err) {
      return Err(err)
    }

    return Ok(user)
  } catch (error) {
    const err = error as Error
    return Err(new UnPriceAuthError({ message: err.message ?? "Unknown error" }))
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
}): Promise<Result<Workspace, UnPriceAuthError | SchemaError>> => {
  const { name, unPriceCustomerId, isInternal, id, isPersonal } = input

  const user = await db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  })

  if (!user) {
    return Err(new UnPriceAuthError({ message: "User not found" }))
  }

  const customer = await db.query.customers.findFirst({
    where: (customer, { eq }) => eq(customer.id, unPriceCustomerId),
  })

  if (!customer) {
    return Err(new UnPriceAuthError({ message: "Customer unprice not found" }))
  }

  // get the subscription of the customer
  const subscription = await db.query.subscriptions.findFirst({
    where: (subscription, { eq }) => eq(subscription.customerId, unPriceCustomerId),
  })

  if (!subscription) {
    return Err(new UnPriceAuthError({ message: "Subscription not found" }))
  }

  const newWorkspace = await db.transaction(async (tx) => {
    try {
      // create a slug for the workspace
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
          .insert(schema.workspaces)
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
            throw new Error(err.message)
          })

        if (!workspace?.id) {
          return Err(new UnPriceAuthError({ message: "Error creating workspace" }))
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
        return Ok(workspace)
      }

      const memberShip = await tx
        .insert(schema.members)
        .values({
          userId: user.id,
          workspaceId: workspaceId,
          role: "OWNER",
        })
        .returning()
        .then((members) => members[0] ?? null)
        .catch((err) => {
          throw new Error(err.message)
        })

      if (!memberShip?.userId) {
        return Err(new UnPriceAuthError({ message: "Error creating member" }))
      }

      return Ok(workspace)
    } catch (error) {
      const err = error as Error
      tx.rollback()
      return Err(new UnPriceAuthError({ message: err.message ?? "Unknown error" }))
    }
  })

  return newWorkspace
}
