import { eq, relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  json,
  numeric,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { projectID } from "../utils/sql"

import { cuid, id, timestamps } from "../utils/fields"
import type {
  customerCreditMetadataSchema,
  customerMetadataSchema,
  customerSessionMetadataSchema,
  stripePlanVersionSchema,
  stripeSetupSchema,
} from "../validators/customer"

import { currencyEnum, typeFeatureVersionEnum } from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
import { projects } from "./projects"
import { invoices, subscriptionItems, subscriptionPhases, subscriptions } from "./subscriptions"

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
    active: boolean("active").notNull().default(true),
    isMain: boolean("is_main").notNull().default(false),
    // all customers will have a default currency - normally the currency of the project
    defaultCurrency: currencyEnum("default_currency").notNull().default("USD"),
    timezone: varchar("timezone", { length: 32 }).notNull().default("UTC"),
  },
  (table) => ({
    email: index("email").on(table.email),
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "pk_customer",
    }),
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_id_fkey",
    }),
  })
)

// entitlements are the actual features that are assigned to a customer
// normally this would match with subscription items but we need to add a way to
// add entitlements to a plan version/customer without having to create a subscription item
// since the subscription item is more of a billing concept and the entitlement is more of a
// usage/access concept.
export const customerEntitlements = pgTableProject(
  "customer_entitlements",
  {
    ...projectID,
    ...timestamps,
    customerId: cuid("customer_id").notNull(),
    // subscriptionId the subscription that the customer is entitled to
    subscriptionId: cuid("subscription_id").notNull(),
    // featurePlanVersionId is the id of the feature plan version that the customer is entitled to
    featurePlanVersionId: cuid("feature_plan_version_id").notNull(),
    // subscriptionItemId is the id of the subscription item that the customer is entitled to
    subscriptionItemId: cuid("subscription_item_id"),
    // subscriptionPhaseId is the id of the subscription phase that the customer is entitled to
    subscriptionPhaseId: cuid("subscription_phase_id"),

    // ****************** defaults from plan version features ******************
    // limit is the limit of the feature that the customer is entitled to
    limit: integer("limit"),
    // units is the units of the feature that the customer is entitled to
    units: integer("units"),
    // usage is the usage of the feature that the customer has used
    usage: numeric("usage").notNull().default("0"),
    // accumulatedUsage is the accumulated usage of the feature that the customer has used
    accumulatedUsage: numeric("accumulated_usage").notNull().default("0"),
    // realtime features are updated in realtime, others are updated periodically
    realtime: boolean("realtime").notNull().default(false),
    // type of the feature plan version - feature or addon
    type: typeFeatureVersionEnum("type").notNull().default("feature"),
    // ****************** end defaults from plan version features ******************

    // normally represent the current billing cycle start and end dates
    // but for custom entitlements can be different, for instance if the customer has a custom entitlement for 1000 users
    // for 1 year.
    validFrom: bigint("valid_from", { mode: "number" }).notNull(),
    validTo: bigint("valid_to", { mode: "number" }),
    // buffer is the period of time that the entitlement is valid after the validTo date
    // this is used to avoid overage charges also give us a windows to revalidate the entitlement when the subscription renew is triggered
    bufferPeriodDays: integer("buffer_period_days").notNull().default(1),
    // resetedAt is the date when the entitlement was reseted
    // normally this is set by the subscription renew event
    resetedAt: bigint("reseted_at", { mode: "number" }).notNull(),

    // active is true if the entitlement is active
    active: boolean("active").notNull().default(true),

    // if it's a custom entitlement, it's not tied to a subscription phase and it's not billed
    isCustom: boolean("is_custom").notNull().default(false),

    // entitlements are updated on a regular basis
    lastUsageUpdateAt: bigint("last_usage_update_at", { mode: "number" })
      .notNull()
      .default(0)
      .$defaultFn(() => Date.now())
      .$onUpdateFn(() => Date.now()),
    metadata: json("metadata").$type<{
      [key: string]: string | number | boolean | null
    }>(),
  },
  (table) => ({
    // create index to improve performace in date range queries
    validFrom: index("valid_from_index").on(table.validFrom),
    validTo: index("valid_to_index").on(table.validTo),
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
    }).onDelete("cascade"),
    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "customer_id_fkey",
    }),
    subscriptionPhasefk: foreignKey({
      columns: [table.subscriptionPhaseId, table.projectId],
      foreignColumns: [subscriptionPhases.id, subscriptionPhases.projectId],
      name: "subscription_phase_id_fkey",
    }).onDelete("cascade"),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "subscription_id_fkey",
    }),
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_id_fkey",
    }),
    // featureSlugIndex: index("feature_slug_index").on(table.featureSlug),
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
  metadata: json("metadata").$type<z.infer<typeof customerSessionMetadataSchema>>(),
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
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_id_fkey",
    }),
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
  subscription: one(subscriptions, {
    fields: [customerEntitlements.subscriptionId, customerEntitlements.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  subscriptionPhase: one(subscriptionPhases, {
    fields: [customerEntitlements.subscriptionPhaseId, customerEntitlements.projectId],
    references: [subscriptionPhases.id, subscriptionPhases.projectId],
  }),
  customer: one(customers, {
    fields: [customerEntitlements.customerId, customerEntitlements.projectId],
    references: [customers.id, customers.projectId],
  }),
  project: one(projects, {
    fields: [customerEntitlements.projectId],
    references: [projects.id],
  }),
}))

export const customersRelations = relations(customers, ({ one, many }) => ({
  project: one(projects, {
    fields: [customers.projectId],
    references: [projects.id],
  }),
  subscriptions: many(subscriptions),
  entitlements: many(customerEntitlements),
  invoices: many(invoices),
  // paymentMethods: many(customerPaymentMethods),
}))

export const customerCreditsRelations = relations(customerCredits, ({ one }) => ({
  customer: one(customers, {
    fields: [customerCredits.customerId, customerCredits.projectId],
    references: [customers.id, customers.projectId],
  }),
  project: one(projects, {
    fields: [customerCredits.projectId],
    references: [projects.id],
  }),
}))
