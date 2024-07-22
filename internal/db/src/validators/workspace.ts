import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { MEMBERSHIP, PLANS } from "@unprice/config"

import * as schema from "../schema"
import { userSelectBase } from "./auth"

export const inviteInsertBase = createInsertSchema(schema.invites, {
  email: z.string().min(3, "Email must be at least 3 characters").email(),
})

export const invitesSelectBase = createSelectSchema(schema.invites)
export const membersSelectBase = createSelectSchema(schema.members)
export const workspaceSelectBase = createSelectSchema(schema.workspaces)
export const workspaceInsertBase = createInsertSchema(schema.workspaces, {
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
}).omit({
  createdAt: true,
  updatedAt: true,
})

export const listMembersSchema = membersSelectBase.extend({
  workspace: workspaceSelectBase,
  user: userSelectBase,
})

export const inviteMembersSchema = inviteInsertBase
  .pick({
    email: true,
    role: true,
  })
  .extend({
    workspaceSlug: z.string(),
  })

export const renameWorkspaceSchema = workspaceInsertBase.pick({
  name: true,
  slug: true,
})

export const changeRoleMemberSchema = membersSelectBase.pick({
  workspaceId: true,
  userId: true,
  role: true,
})

export const deleteWorkspaceSchema = workspaceInsertBase.pick({
  slug: true,
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

export const workspaceSelectSchema = createSelectSchema(schema.workspaces)

export const workspacesJWTPayload = workspaceSelectSchema
  .pick({
    id: true,
    slug: true,
    isPersonal: true,
    plan: true,
    enabled: true,
    unPriceCustomerId: true,
  })
  .extend({
    role: membersSelectBase.shape.role,
  })

export type WorkspacesJWTPayload = z.infer<typeof workspacesJWTPayload>
export type WorkspaceRole = z.infer<typeof membersSelectBase.shape.role>
export type WorkspacePlan = z.infer<typeof workspaceSelectSchema.shape.plan>
export type PurchaseOrg = z.infer<typeof purchaseWorkspaceSchema>
export type Workspace = z.infer<typeof workspaceSelectSchema>
export type Member = z.infer<typeof membersSelectBase>
export type InviteOrgMember = z.infer<typeof inviteOrgMemberSchema>
export type RenameWorkspace = z.infer<typeof renameWorkspaceSchema>
export type InviteMember = z.infer<typeof inviteMembersSchema>
