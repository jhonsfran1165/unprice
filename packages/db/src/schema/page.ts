import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { z } from "zod"

import { project } from "./project"

export const page = pgTable(
  "page",
  {
    // FIXME: this should be a uuid
    id: text("id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    // Coming from our auth provider clerk
    // This can be either a user_xxx or org_xxx id
    tenantId: text("tenant_id").notNull(),
    slug: text("slug").notNull().unique(), // we love random words
    html: text("html"),
    version: integer("version").default(0).notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, {
        onDelete: "cascade",
      }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.version] }),
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
