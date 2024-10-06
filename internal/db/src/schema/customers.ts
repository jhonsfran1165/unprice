import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  json,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID } from "../utils/sql"

import { cuid, id, timestamps } from "../utils/fields.sql"
import type {
  customerMetadataSchema,
  stripePlanVersionSchema,
  stripeSetupSchema,
} from "../validators/customer"

import { aggregationMethodEnum, currencyEnum, typeFeatureEnum } from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
import { projects } from "./projects"
import { subscriptionPhases, subscriptions } from "./subscriptions"

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
    timezone: varchar("timezone", { length: 32 }).notNull().default("UTC"),
    // beta features
  },
  (table) => ({
    email: index("email").on(table.email),
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer",
    }),
  })
)

// entitlements are the actual features that are assigned to a customer
// normally this would match with subscription items but we need to add a way to
// add entitlements to a plan version without having to create a subscription item
// since the subscription item is more of a billing concept and the entitlement is more of a
// usage concept.
export const customerEntitlements = pgTableProject(
  "customer_entitlements",
  {
    ...projectID,
    ...timestamps,
    customerId: cuid("customer_id").notNull(),
    // subscriptionPhaseId is the id of the subscription phase that the customer is entitled to
    subscriptionPhaseId: cuid("subscription_phase_id").notNull(),
    // featurePlanVersionId is the id of the feature plan version that the customer is entitled to
    featurePlanVersionId: cuid("feature_plan_version_id").notNull(),

    // ****************** defaults from plan version features ******************
    // These fields are duplicate but this improves the performance when checking the usage
    // This table is cached in redis as well. All events usage are sent to tynibird and this table
    // is restored with events in the subscription.
    // quantity is the quantity of the feature that the customer is entitled to
    quantity: integer("quantity"),
    // limit is the limit of the feature that the customer is entitled to
    limit: integer("limit"),
    // usage is the usage of the feature that the customer has used
    usage: integer("usage"),
    // featureSlug is the slug of the feature that the customer is entitled to
    featureSlug: text("feature_slug").notNull(),
    // featureType is the type of the feature that the customer is entitled to
    featureType: typeFeatureEnum("feature_type").notNull(),
    // aggregationMethod is the method to aggregate the feature quantity - use for calculated the current usage of the feature
    aggregationMethod: aggregationMethodEnum("aggregation_method").default("sum").notNull(),
    // realtime features are updated in realtime, others are updated periodically
    realtime: boolean("realtime").notNull().default(false),
    // type of the feature plan version - feature or addon
    type: text("type").notNull().default("feature"),
    // ****************** end defaults from plan version features ******************

    // if it's a custom entitlement, it's not tied to a subscription phase and it's not billed
    isCustom: boolean("is_custom").notNull().default(false),
    // entitlements are updated on a regular basis
    lastUpdatedAt: bigint("last_updated_at", { mode: "number" }).notNull(),
    metadata: json("metadata").$type<{
      [key: string]: string | number | boolean | null
    }>(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer_entitlement",
    }),
    featurePlanVersionfk: foreignKey({
      columns: [table.featurePlanVersionId, table.projectId],
      foreignColumns: [planVersionFeatures.id, planVersionFeatures.projectId],
      name: "feature_plan_version_id_fkey",
    }),
    subscriptionPhasefk: foreignKey({
      columns: [table.subscriptionPhaseId, table.projectId],
      foreignColumns: [subscriptionPhases.id, subscriptionPhases.projectId],
      name: "subscription_phase_id_fkey",
    }),
    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "customer_id_fkey",
    }),
  })
)

// when customer are created, we need to perform a session flow to add a payment method
// this table allows us to keep track of the params we need to perform the flow
// after the payment method is added in the payment provider
export const customerSessions = pgTableProject("customer_sessions", {
  ...id,
  ...timestamps,
  customer: json("customer").notNull().$type<z.infer<typeof stripeSetupSchema>>(),
  planVersion: json("plan_version").notNull().$type<z.infer<typeof stripePlanVersionSchema>>(),
})

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

export const customerEntitlementsRelations = relations(customerEntitlements, ({ one }) => ({
  subscriptionPhase: one(subscriptionPhases, {
    fields: [customerEntitlements.subscriptionPhaseId, customerEntitlements.projectId],
    references: [subscriptionPhases.id, subscriptionPhases.projectId],
  }),
  featurePlanVersion: one(planVersionFeatures, {
    fields: [customerEntitlements.featurePlanVersionId, customerEntitlements.projectId],
    references: [planVersionFeatures.id, planVersionFeatures.projectId],
  }),
  customer: one(customers, {
    fields: [customerEntitlements.customerId, customerEntitlements.projectId],
    references: [customers.id, customers.projectId],
  }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  project: one(projects, {
    fields: [customers.projectId],
    references: [projects.id],
  }),
  subscriptions: many(subscriptions),
  entitlements: many(customerEntitlements),
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
