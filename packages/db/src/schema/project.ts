import { relations } from "drizzle-orm"
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { tenantID, timestamps, workspaceID } from "../utils/sql"
import { projectTier } from "./enums"
import { workspace } from "./workspace"

export const project = pgTable(
  "project",
  {
    ...workspaceID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    name: text("name"),
    tier: projectTier("tier").default("FREE"),
    url: text("url"),
    // domain: text("url"),
    // subdomain: text("url"),
  },
  (table) => {
    return {
      projectWorkspaceInx: index("project_workspace_id_idx").on(
        table.workspaceId
      ),
      projectSlugInx: uniqueIndex("project_slug_idx").on(table.slug),
      workspaceTenantIdUniqueInx: index("project_tenant_uidx").on(
        table.tenantId
      ),
      projectTenantIdInx: index("project_tenant_uidx").on(table.tenantId),
    }
  }
)

export const projectsRelations = relations(project, ({ one }) => ({
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
}))

export const createProjectSchema = createInsertSchema(project).extend({
  id: z.string().optional(),
  slug: z.string().optional(),
  workspaceId: z.string().optional(),
  tenantId: z.string().optional(),
  name: z.string(),
  url: z.string().url(),
})

export const renameProjectSchema = z.object({
  projectSlug: z.string(),
  name: z.string().min(4, "Name must be at least 5 characters"),
})

export const deleteProjectSchema = z.object({
  slug: z.string(),
})

export const transferToPersonalProjectSchema = z.object({
  slug: z.string(),
})

export const transferToWorkspaceSchema = z.object({
  projectSlug: z.string(),
  tenantId: z.string(),
})
export const selectProjectSchema = createSelectSchema(project)

export type CreateProject = z.infer<typeof createProjectSchema>
export type SelectProject = z.infer<typeof selectProjectSchema>
export type RenameProject = z.infer<typeof renameProjectSchema>
export type TransferToWorkspace = z.infer<typeof transferToWorkspaceSchema>
