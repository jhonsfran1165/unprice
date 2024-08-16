import { relations } from "drizzle-orm"
import { boolean, index, text, unique, varchar } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, timestamps, workspaceID } from "../utils/sql"
import { currencyEnum } from "./enums"
import { workspaces } from "./workspaces"

export const projects = pgTableProject(
  "projects",
  {
    ...id,
    ...workspaceID,
    ...timestamps,
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").default("").notNull(),
    // if not enabled, the project will not be accessible and all API requests will be rejected
    enabled: boolean("enabled").default(true).notNull(),
    isInternal: boolean("is_internal").default(false).notNull(),
    defaultCurrency: currencyEnum("default_currency").default("USD").notNull(),
    timezone: varchar("timezone", { length: 32 }).default("UTC"),
  },
  (table) => ({
    slug: index("slug_index").on(table.slug),
    unique: unique("unique_slug").on(table.slug),
  })
)

export const projectsRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
}))
