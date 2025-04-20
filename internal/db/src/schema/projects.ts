import { eq, relations } from "drizzle-orm"
import { boolean, foreignKey, index, text, unique, uniqueIndex, varchar } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, timestamps, workspaceID } from "../utils/fields"
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
    // there must be only one main workspace per the whole project
    isMain: boolean("is_main").default(false),
    defaultCurrency: currencyEnum("default_currency").notNull(),
    timezone: varchar("timezone", { length: 32 }).notNull(),
  },
  (table) => ({
    mainProject: uniqueIndex("main_project").on(table.isMain).where(eq(table.isMain, true)),
    slug: index("slug_index").on(table.slug),
    unique: unique("unique_slug").on(table.slug),
    workspace: foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspaces.id],
      name: "fk_project_workspace",
    }).onDelete("cascade"),
  })
)

export const projectsRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
}))
