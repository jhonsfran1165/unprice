import { relations } from "drizzle-orm"
import { boolean, primaryKey, uniqueIndex } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { encrypted, timestamps } from "../utils/fields.sql"
import { projectID } from "../utils/sql"
import { paymentProviderEnum } from "./enums"
import { projects } from "./projects"

export const paymentProviderConfig = pgTableProject(
  "payment_provider_config",
  {
    ...projectID,
    ...timestamps,
    active: boolean("active").notNull().default(false),
    paymentProvider: paymentProviderEnum("payment_provider").notNull().default("stripe"),
    key: encrypted("key").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_config",
    }),
    // a project can only have one config per payment provider
    unique: uniqueIndex("unique_payment_provider_config").on(
      table.paymentProvider,
      table.projectId
    ),
  })
)

export const paymentProviderConfigRelations = relations(paymentProviderConfig, ({ one }) => ({
  project: one(projects, {
    fields: [paymentProviderConfig.projectId],
    references: [projects.id],
  }),
}))
