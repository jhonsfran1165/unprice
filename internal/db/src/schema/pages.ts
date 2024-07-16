import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"
import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"

export const pages = pgTableProject(
  "pages",
  {
    ...projectID,
    ...timestamps,
    content: text("content"),
    name: text("name").notNull(),
    customDomain: text("custom_domain").unique(),
    subdomain: text("subdomain").unique().notNull(),
    slug: text("slug").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "page_pkey",
    }),
    slug: uniqueIndex("slug_page").on(table.slug, table.projectId),
    indexSubdomain: index("subdomain_index").on(table.subdomain),
    indexCustomDomain: index("custom_domain_index").on(table.customDomain),
  })
)
