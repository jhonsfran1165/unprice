import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { z } from "zod"

import { project } from "./project"
import { commonColumns } from "./shared"

export const page = pgTable(
  "page",
  {
    ...commonColumns,
    slug: text("slug").notNull().unique(), // we love random words
    html: text("html"),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
      }),
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
})

export const updatePageSchema = z.object({
  id: z.string(),
  projectSlug: z.string(),
  html: z.string(),
})
export type CreatePage = z.infer<typeof createPageSchema>
