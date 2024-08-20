import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import * as schema from "../schema"
import { userSelectBase } from "./auth"

export const invitesSelectBase = createSelectSchema(schema.invites)
export const inviteInsertBase = createInsertSchema(schema.invites, {
  email: z.string().min(3, "Email must be at least 3 characters").email(),
})

export const membersSelectBase = createSelectSchema(schema.members)

export const workspaceSelectBase = createSelectSchema(schema.workspaces)
export const workspaceInsertBase = createInsertSchema(schema.workspaces, {
  name: z.string().min(3, "Name must be at least 3 characters"),
}).omit({
  createdAtM: true,
  updatedAtM: true,
  unPriceCustomerId: true,
  slug: true,
})

export const listMembersSchema = membersSelectBase.extend({
  workspace: workspaceSelectBase,
  user: userSelectBase,
})

export const inviteMembersSchema = inviteInsertBase.pick({
  email: true,
  role: true,
})

export const workspacesJWTPayload = workspaceSelectBase
  .pick({
    id: true,
    slug: true,
    isPersonal: true,
    enabled: true,
    unPriceCustomerId: true,
  })
  .extend({
    role: membersSelectBase.shape.role,
  })

export type WorkspacesJWTPayload = z.infer<typeof workspacesJWTPayload>
export type WorkspaceRole = z.infer<typeof membersSelectBase.shape.role>
export type Workspace = z.infer<typeof workspaceSelectBase>
export type WorkspaceInsert = z.infer<typeof workspaceInsertBase>
export type Member = z.infer<typeof membersSelectBase>
export type InviteMember = z.infer<typeof inviteMembersSchema>
