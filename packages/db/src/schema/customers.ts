import { relations } from "drizzle-orm"
import { index, primaryKey, text, unique } from "drizzle-orm/pg-core"

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
    // payment info
    // {
    // stripeCustomerId
    // }
    // beta features
    // payment config - stripe integration
    // metadata
    // external id - external aliases
  },
  (table) => ({
    email: index("email").on(table.email),
    unique: unique("unique_email_project").on(table.email, table.projectId),
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer",
    }),
  })
)

export const customersRelations = relations(customers, ({ one, many }) => ({
  project: one(projects, {
    fields: [customers.projectId],
    references: [projects.id],
  }),
}))
