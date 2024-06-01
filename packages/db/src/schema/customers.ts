import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  index,
  json,
  primaryKey,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import type {
  customerMetadataSchema,
  customerProvidersMetadataSchema,
} from "../validators"
import { currencyEnum, paymentProviderEnum } from "./enums"
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
    defaultCurrency: currencyEnum("default_currency").default("USD"),
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

// TODO: add provider method here
// TODO: add type to see if it's card or bank account
export const customerPaymentProviders = pgTableProject(
  "customer_payment_providers",
  {
    ...projectID,
    ...timestamps,
    customerId: text("customer_id").notNull(),
    paymentProvider: paymentProviderEnum("payment_provider").notNull(),
    paymentProviderCustomerId: text("payment_provider_customer_id")
      .notNull()
      .unique(),
    metadata:
      json("metadata").$type<z.infer<typeof customerProvidersMetadataSchema>>(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer_payment_method",
    }),

    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "payment_customer_id_fkey",
    }),

    uniquepaymentcustomer: uniqueIndex("unique_payment_provider").on(
      table.customerId,
      table.paymentProvider
    ),
  })
)

// TODO: create provider payment method table
// success_url
// token
// name

export const customersRelations = relations(customers, ({ one, many }) => ({
  project: one(projects, {
    fields: [customers.projectId],
    references: [projects.id],
  }),
  subscriptions: many(subscriptions),
  providers: many(customerPaymentProviders),
}))

export const customersProvidersRelations = relations(
  customerPaymentProviders,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [customerPaymentProviders.projectId],
      references: [projects.id],
    }),
    customer: one(customers, {
      fields: [
        customerPaymentProviders.customerId,
        customerPaymentProviders.projectId,
      ],
      references: [customers.id, customers.projectId],
    }),
  })
)
