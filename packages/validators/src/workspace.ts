import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { MEMBERSHIP, PLANS } from "@builderai/config"
import { schema } from "@builderai/db"

export const workspaceSelectBase = createSelectSchema(schema.workspaces)
export const workspaceInsertBase = createInsertSchema(schema.workspaces, {
  slug: (schema) =>
    schema.slug
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
})

// TODO: fix this enum - put all in db constants
export const inviteOrgMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MEMBERSHIP),
})

export const purchaseWorkspaceSchema = z.object({
  orgName: z.string().min(5, "Name must be at least 5 characters"),
  planId: z.string().refine(
    (str) =>
      Object.values(PLANS)
        .map((p) => p.priceId ?? "")
        .includes(str),
    "Invalid planId"
  ),
})

export const selectWorkspaceSchema = createSelectSchema(schema.workspaces)

export type PurchaseOrg = z.infer<typeof purchaseWorkspaceSchema>
export type SelectWorkspace = z.infer<typeof selectWorkspaceSchema>
export type InviteOrgMember = z.infer<typeof inviteOrgMemberSchema>
