import { integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { z } from "zod"

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

export const createPageSchema = z.object({
  id: z.string().optional(),
  projectSlug: z.string(),
  html: z.string(),
  version: z.number().default(0),
})

export const updatePageSchema = z.object({
  id: z.string(),
  projectSlug: z.string(),
  html: z.string(),
  version: z.number().default(0),
})
export type CreatePage = z.infer<typeof createPageSchema>
