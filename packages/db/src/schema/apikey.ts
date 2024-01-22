import { relations } from "drizzle-orm"
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { z } from "zod"

import { projectID, tenantID, timestamps } from "../utils/sql"
import { project } from "./project"

export const apikey = pgTable(
  "apikey",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    expiresAt: timestamp("expires_at", { mode: "date" }),
    lastUsed: timestamp("last_used", { mode: "date" }),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    key: text("key").unique().notNull(),
  },
  (table) => {
    return {
      apiKeyProjectInx: index("apikey_project_id_idx").on(table.projectId),
      apiKeyInx: uniqueIndex("apikey_key_idx").on(table.key),
      apiKeyTenantIdInx: index("apikey_tenant_uidx").on(table.tenantId),
    }
  }
)

export const apiKeysRelations = relations(apikey, ({ one }) => ({
  project: one(project, {
    fields: [apikey.projectId],
    references: [project.id],
  }),
}))

export const createApiKeySchema = z.object({
  projectSlug: z.string(),
  name: z.string(),
  expiresAt: z.date().optional(),
  tenantId: z.string().optional(),
})
export type CreateApiKey = z.infer<typeof createApiKeySchema>
