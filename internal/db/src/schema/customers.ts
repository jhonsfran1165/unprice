import { relations } from "drizzle-orm"
import { boolean, index, json, primaryKey, text, unique } from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import type { customerMetadataSchema } from "../validators"
import { currencyEnum } from "./enums"
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
    stripeCustomerId: text("stripe_customer_id").unique("stripe_customer_unique"),
    active: boolean("active").default(true),
    // all customers will have a default currency - normally the currency of the project
    defaultCurrency: currencyEnum("default_currency").default("USD").notNull(),
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
// export const customerPaymentMethods = pgTableProject(
//   "customer_payment_methods",
//   {
//     ...projectID,
//     ...timestamps,
//     customerId: text("customer_id").notNull(),
//     paymentProvider: paymentProviderEnum("payment_provider").notNull(),
//     isDefault: boolean("default").default(false),
//     paymentMethodId: text("payment_method_id").unique().notNull(),
//     metadata: json("metadata").$type<z.infer<typeof customerProvidersMetadataSchema>>(),
//   },
//   (table) => ({
//     primary: primaryKey({
//       columns: [table.id, table.projectId],
//       name: "pk_customer_payment_method",
//     }),

//     customerfk: foreignKey({
//       columns: [table.customerId, table.projectId],
//       foreignColumns: [customers.id, customers.projectId],
//       name: "payment_customer_id_fkey",
//     }),

//     uniquepaymentcustomer: uniqueIndex("unique_payment_provider").on(
//       table.customerId,
//       table.paymentProvider
//     ),
//   })
// )

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
  // paymentMethods: many(customerPaymentMethods),
}))

// export const customersMethodsRelations = relations(customerPaymentMethods, ({ one }) => ({
//   project: one(projects, {
//     fields: [customerPaymentMethods.projectId],
//     references: [projects.id],
//   }),
//   customer: one(customers, {
//     fields: [customerPaymentMethods.customerId, customerPaymentMethods.projectId],
//     references: [customers.id, customers.projectId],
//   }),
// }))
