import { relations } from "drizzle-orm"
import { index, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import { projects } from "./projects"

export const apikeys = pgTableProject(
  "apikeys",
  {
    ...projectID,
    ...timestamps,
    expiresAt: timestamp("expires_at", { mode: "date" }),
    lastUsed: timestamp("last_used", { mode: "date" }),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    name: text("name").notNull(),
    key: text("key").unique().notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id],
    }),
    key: index("key").on(table.key),
    project: index("project").on(table.projectId),
  })
)

export const apiKeysRelations = relations(apikeys, ({ one }) => ({
  project: one(projects, {
    fields: [apikeys.projectId],
    references: [projects.id],
  }),
}))
