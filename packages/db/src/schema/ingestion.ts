import { relations } from "drizzle-orm"
import { index, json, pgTable, text } from "drizzle-orm/pg-core"

import { projectID, tenantID, timestamps } from "../utils/sql"
import { apikey } from "./apikey"
import { project } from "./project"

export const ingestion = pgTable(
  "ingestion",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
      }),
    apikeyId: text("apikey_id")
      .notNull()
      .references(() => apikey.id, {
        onDelete: "cascade",
      }),
    schema: json("schema").notNull(),
    hash: text("hash").notNull(),
    parent: text("parent"),
    origin: text("origin").notNull(),
  },
  (table) => {
    return {
      ingestionApiKeyInx: index("ingestion_apikey_id_idx").on(table.apikeyId),
      ingestionProjectInx: index("ingestion_project_id_idx").on(
        table.projectId
      ),
      projectTenantIdInx: index("project_tenant_uidx").on(table.tenantId),
    }
  }
)

export const ingestionsRelations = relations(ingestion, ({ one }) => ({
  project: one(project, {
    fields: [ingestion.projectId],
    references: [project.id],
  }),
  apikey: one(apikey, {
    fields: [ingestion.apikeyId],
    references: [apikey.id],
  }),
}))
