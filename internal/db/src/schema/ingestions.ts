import { relations } from "drizzle-orm"
import { foreignKey, primaryKey, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, timestamps } from "../utils/fields.sql"
import { projectID } from "../utils/sql"
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
    apikeyId: cuid("apikey_id").notNull(),
  },
  (table) => {
    return {
      fk: foreignKey({
        columns: [table.apikeyId, table.projectId],
        foreignColumns: [apikeys.id, apikeys.projectId],
        name: "ingestions_apikey_id_fkey",
      }),
      primary: primaryKey({
        columns: [table.projectId, table.id],
        name: "ingestions_pkey",
      }),
    }
  }
)

export const ingestionsRelations = relations(ingestions, ({ one }) => ({
  project: one(projects, {
    fields: [ingestions.projectId],
    references: [projects.id],
  }),
  apikey: one(apikeys, {
    fields: [ingestions.apikeyId],
    references: [apikeys.id],
  }),
}))
