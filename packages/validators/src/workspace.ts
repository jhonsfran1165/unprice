import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { MEMBERSHIP, PLANS } from "@builderai/config"
import { schema } from "@builderai/db"

export const membersSelectBase = createSelectSchema(schema.members)
export const workspaceSelectBase = createSelectSchema(schema.workspaces)
export const workspaceInsertBase = createInsertSchema(schema.workspaces, {
  name: z.string().min(3, "Name must be at least 3 characters"),
})

// TODO: fix this enum - put all in db constants
export const inviteOrgMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MEMBERSHIP),
})

export const purchaseWorkspaceSchema = workspaceInsertBase
  .pick({
    name: true,
  })
  .extend({
    planId: z.string().refine(
      (str) =>
        Object.values(PLANS)
          .map((p) => p.priceId ?? "")
          .includes(str),
      "Invalid planId"
    ),
  })

export const selectWorkspaceSchema = createSelectSchema(schema.workspaces)

export const workspacesJWTPayload = selectWorkspaceSchema
  .pick({
    id: true,
    slug: true,
    isPersonal: true,
    plan: true,
  })
  .extend({
    role: membersSelectBase.shape.role,
  })

export type WorkspacesJWTPayload = z.infer<typeof workspacesJWTPayload>
export type WorkspaceRole = z.infer<typeof membersSelectBase.shape.role>
export type PurchaseOrg = z.infer<typeof purchaseWorkspaceSchema>
export type SelectWorkspace = z.infer<typeof selectWorkspaceSchema>
export type InviteOrgMember = z.infer<typeof inviteOrgMemberSchema>
