import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  json,
  primaryKey,
  text,
  unique,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import type { customerMetadataSchema } from "../validators"
import { projects } from "./projects"
import { subscriptions } from "./subscriptions"

export const customers = pgTableProject(
  "customers",
  {
    ...projectID,
    ...timestamps,
    email: text("email").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    metadata: json("metadata").$type<z.infer<typeof customerMetadataSchema>>(),
    active: boolean("active").default(true),
    // beta features
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
  subscriptions: many(subscriptions),
}))
