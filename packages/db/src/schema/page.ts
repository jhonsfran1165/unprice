import { integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"

import { projectID, tenantID, timestamps } from "../utils/sql"

export const page = pgTable(
  "page",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    html: text("html"),
    version: integer("version").default(0).notNull(),
  },
  (table) => {
    return {
      projectSlugInx: uniqueIndex("project_slug_idx").on(table.slug),
    }
  }
)
