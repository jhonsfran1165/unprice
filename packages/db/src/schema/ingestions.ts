import { relations } from "drizzle-orm"
import { index, primaryKey, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import { apikeys } from "./apikeys"
import { projects } from "./projects"

export const ingestions = pgTableProject(
  "ingestions",
  {
    ...projectID,
    ...timestamps,
    schema: text("schema").notNull(),
    hash: text("hash").notNull(),
    parent: text("parent"),
    origin: text("origin").notNull(),
    apiKeyId: cuid("apikey_id").notNull(),
  },
  (table) => {
    return {
      primary: primaryKey({
        columns: [table.projectId, table.id],
      }),
      project: index("project").on(table.projectId),
    }
  }
)

export const ingestionsRelations = relations(ingestions, ({ one }) => ({
  project: one(projects, {
    fields: [ingestions.projectId],
    references: [projects.id],
  }),
  apikey: one(apikeys, {
    fields: [ingestions.apiKeyId],
    references: [apikeys.id],
  }),
}))
