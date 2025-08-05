import { relations } from "drizzle-orm"
import { bigint, boolean, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { timestamps } from "../utils/fields"
import { projectID } from "../utils/sql"
import { projects } from "./projects"

export const apikeys = pgTableProject(
  "apikeys",
  {
    ...projectID,
    ...timestamps,
    expiresAt: bigint("expires_at_m", { mode: "number" }),
    lastUsed: bigint("last_used_m", { mode: "number" }),
    revokedAt: bigint("revoked_at_m", { mode: "number" }),
    isRoot: boolean("is_root").notNull().default(false),
    name: text("name").notNull(),
    key: text("key").notNull(),
    hash: text("hash").notNull().default(""),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_apikeys",
    }),
    key: uniqueIndex("key").on(table.key),
    hash: uniqueIndex("hash").on(table.hash),
  })
)

export const apiKeysRelations = relations(apikeys, ({ one }) => ({
  project: one(projects, {
    fields: [apikeys.projectId],
    references: [projects.id],
  }),
}))
