import { eq, relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  json,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID } from "../utils/sql"

import { cuid, id, timestamps } from "../utils/fields.sql"
import type {
  customerCreditMetadataSchema,
  customerMetadataSchema,
  stripePlanVersionSchema,
  stripeSetupSchema,
} from "../validators/customer"

import { aggregationMethodEnum, currencyEnum, typeFeatureEnum } from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
import { projects } from "./projects"
import { subscriptionItems, subscriptions } from "./subscriptions"

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
    // subscriptionItemId is the id of the subscription item that the customer is entitled to
    subscriptionItemId: cuid("subscription_item_id"),
    // featurePlanVersionId is the id of the feature plan version that the customer is entitled to
    featurePlanVersionId: cuid("feature_plan_version_id").notNull(),

    // ****************** defaults from plan version features ******************
    // These fields are duplicate but this improves the performance when checking the usage
    // This table is cached in redis as well. All events usage are sent to tynibird and this table
    // is restored with events in the subscription.
    // amount of units of the feature that the customer is entitled to
    units: integer("units"),
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

    // We need to know when the entitlement start and when it ends
    startAt: bigint("start_at", { mode: "number" }).notNull(),
    endAt: bigint("end_at", { mode: "number" }),

    // if it's a custom entitlement, it's not tied to a subscription phase and it's not billed
    isCustom: boolean("is_custom").notNull().default(false),
    // entitlements are updated on a regular basis
    lastUpdatedAt: bigint("last_updated_at", { mode: "number" })
      .notNull()
      .default(0)
      .$defaultFn(() => Date.now())
      .$onUpdateFn(() => Date.now()),
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
    subscriptionItemfk: foreignKey({
      columns: [table.subscriptionItemId, table.projectId],
      foreignColumns: [subscriptionItems.id, subscriptionItems.projectId],
      name: "subscription_item_id_fkey",
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

// when there is an overdue charge, we need to create a credit for the customer
// this is used to handle the credits for the invoices, normally due to cancel or downgrade mid cycle
export const customerCredits = pgTableProject(
  "customer_credits",
  {
    ...projectID,
    ...timestamps,
    totalAmount: integer("total_amount").notNull(),
    metadata: json("metadata").$type<z.infer<typeof customerCreditMetadataSchema>>(),
    customerId: cuid("customer_id").notNull(),
    amountUsed: integer("amount_used").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "customer_credits_pkey",
    }),
    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "customer_credits_customer_id_fkey",
    }),
    // only one active == true credit per customer
    unique: uniqueIndex("customer_credits_customer_id_active_key")
      .on(table.customerId, table.active)
      .where(eq(table.active, true)),
  })
)

export const customerEntitlementsRelations = relations(customerEntitlements, ({ one }) => ({
  subscriptionItem: one(subscriptionItems, {
    fields: [customerEntitlements.subscriptionItemId, customerEntitlements.projectId],
    references: [subscriptionItems.id, subscriptionItems.projectId],
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

export const customerCreditsRelations = relations(customerCredits, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCredits.customerId, customerCredits.projectId],
    references: [customers.id, customers.projectId],
  }),
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
