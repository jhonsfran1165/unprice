import { relations } from "drizzle-orm"
import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import { projects } from "./projects"

export const customers = pgTableProject(
  "customers",
  {
    ...projectID,
    ...timestamps,
    email: text("email").notNull(),
    name: text("name").notNull(),
  },
  (table) => ({
    email: index("email").on(table.email),
    unique: uniqueIndex("unique_email_project").on(
      table.email,
      table.projectId
    ),
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer",
    }),
  })
)

export const customersRelations = relations(customers, ({ one }) => ({
  project: one(projects, {
    fields: [customers.projectId],
    references: [projects.id],
  }),
}))
