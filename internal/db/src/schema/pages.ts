import { json, primaryKey, text } from "drizzle-orm/pg-core"

import type { z } from "zod"
import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import type { pageContentSchema } from "../validators/pages"

export const pages = pgTableProject(
  "pages",
  {
    ...projectID,
    ...timestamps,
    content: json("content").$type<z.infer<typeof pageContentSchema>>().notNull(),
    name: text("name").notNull(),
    customDomain: text("custom_domain"),
    // TODO: add unique constraint to custom domain
    subdomain: text("subdomain"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "page_pkey",
    }),
  })
)
