import { db, eq, schema, utils } from "@builderai/db"

import type { WebhookEvent } from "./server"

export async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, first_name, username } = event.data

      // use the same id for this workspace so it's easy to identify the tenant inside the app
      const workspaceId = utils.workspaceIdFromTenantId(id)

      const orgSlug = username ?? utils.generateSlug(2)

      await db
        .insert(schema.workspace)
        .values({
          id: workspaceId,
          tenantId: id,
          slug: orgSlug,
          name: first_name ?? orgSlug,
          isPersonal: true,
        })
        .onConflictDoUpdate({
          target: schema.workspace.id,
          set: {
            tenantId: id,
            slug: orgSlug,
            name: first_name ?? orgSlug,
            isPersonal: true,
          },
          where: eq(schema.workspace.id, workspaceId),
        })

      break
    }

    case "organization.deleted":
    case "user.deleted": {
      const { id } = event.data

      if (!id) {
        throw new Error("Id not provided when trying to delete user")
      }

      await db.delete(schema.workspace).where(eq(schema.workspace.tenantId, id))

      break
    }

    case "session.created":
      break
    case "session.revoked":
    case "session.removed":
    case "session.ended":
      break

    case "organizationMembership.deleted":
    case "organizationMembership.created":
    case "organizationMembership.updated":
      break

    case "organization.created":
    case "organization.updated": {
      const { slug, name, id } = event.data

      const orgSlug = slug ? slug : utils.generateSlug(2)
      const workspaceId = utils.workspaceIdFromTenantId(id)

      const workspaceData = await db.query.workspace.findFirst({
        columns: {
          id: true,
        },
        where: (workspace, { eq, and }) => and(eq(workspace.id, workspaceId)),
      })

      if (workspaceData) {
        await db
          .update(schema.workspace)
          .set({
            name: name ?? orgSlug,
            slug: orgSlug,
            tenantId: id,
            isPersonal: false,
          })
          .where(eq(schema.workspace.id, workspaceData.id))
      } else {
        await db.insert(schema.workspace).values({
          id: workspaceId,
          tenantId: id,
          slug: orgSlug,
          name: name ?? orgSlug,
          isPersonal: false,
        })
      }

      break
    }

    default: {
      console.log("🆗 Clerk Webhook Unhandled Event Type: ", event.type)
      return
    }
  }

  console.log("✅ Clerk Webhook Processed")
}
