import { relations } from "drizzle-orm"
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"

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
