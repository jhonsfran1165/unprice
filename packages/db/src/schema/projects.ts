import { relations } from "drizzle-orm"
import { index, primaryKey, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { timestamps, workspaceID } from "../utils/sql"
import { projectTierEnum } from "./enums"
import { workspaces } from "./workspaces"

export const projects = pgTableProject(
  "projects",
  {
    ...workspaceID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tier: projectTierEnum("tier").default("free").notNull(),
    url: text("url").default("").notNull(),
  },
  (table) => ({
    slug: index("slug").on(table.slug),
    primary: primaryKey({
      columns: [table.workspaceId, table.id],
    }),
  })
)

export const projectsRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
}))
