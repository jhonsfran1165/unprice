import { relations } from "drizzle-orm"
import {
  index,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

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
    key: text("key").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
    }),
    key: index("key").on(table.key),
    slug: uniqueIndex("slug").on(table.name),
  })
)

export const apiKeysRelations = relations(apikeys, ({ one }) => ({
  project: one(projects, {
    fields: [apikeys.projectId],
    references: [projects.id],
  }),
}))
