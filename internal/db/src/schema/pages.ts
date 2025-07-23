import { boolean, index, jsonb, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"
import type { z } from "zod"
import { pgTableProject } from "../utils/_table"
import { timestamps } from "../utils/fields"
import { projectID } from "../utils/sql"
import type { colorPaletteSchema, faqSchema, planSchema } from "../validators/pages"

export const pages = pgTableProject(
  "pages",
  {
    ...projectID,
    ...timestamps,
    name: text("name").default("").notNull(),
    customDomain: text("custom_domain").unique(),
    subdomain: text("subdomain").unique().notNull(),
    slug: text("slug").notNull(),
    ctaLink: text("cta_link").notNull().default(""),
    description: text("description"),
    title: text("title").notNull().default(""),
    copy: text("copy").notNull().default(""),
    faqs: jsonb("faqs").notNull().$type<z.infer<typeof faqSchema>[]>(),
    colorPalette: jsonb("color_palette").notNull().$type<z.infer<typeof colorPaletteSchema>>(),
    selectedPlans: jsonb("selected_plans").notNull().$type<z.infer<typeof planSchema>[]>(),
    logo: text("logo"),
    logoType: text("logo_type"),
    font: text("font"),
    published: boolean("published").default(false).notNull(),
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
