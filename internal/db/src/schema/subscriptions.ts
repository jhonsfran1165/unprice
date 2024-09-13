import { eq, relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { cuid, timestamps } from "../utils/fields.sql"
import { projectID } from "../utils/sql"
import type { StartCycle } from "../validators/shared"
import type { subscriptionMetadataSchema } from "../validators/subscriptions"
import { customers } from "./customers"
import {
  collectionMethodEnum,
  currencyEnum,
  invoiceStatusEnum,
  invoiceTypeEnum,
  paymentProviderEnum,
  subscriptionStatusEnum,
  typeSubscriptionEnum,
  whenToBillEnum,
} from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
import { versions } from "./planVersions"
import { projects } from "./projects"

// subscriptions contains the information about the subscriptions of the customers to different items
// like plans, addons, etc.
// when the subscription billing cycle ends, we create a record in another table called invoices (phases) with the items of the subscription
// a customer could be subscribed to multiple items at the same time
// we calculate the entitlements of the subscription based on the items of the subscription and save them in a redis cache to avoid calculating them every time
// also we can use binmanry to store the data in a more efficient way in redis
export const subscriptions = pgTableProject(
  "subscriptions",
  {
    ...projectID,
    ...timestamps,
    // customer to get the payment info from that customer
    customerId: cuid("customers_id").notNull(),

    // payment method id of the customer - if not set, the first payment method will be used
    // TODO: support multiple payment methods - associated with a customer instead of a subscription
    defaultPaymentMethodId: text("default_payment_method_id"),

    // data from plan version when the subscription was created
    // payment provider configured for the plan. This should not changed after the subscription is created
    // plan version has the payment provider configured, currency and all the other data needed to create the invoice
    // every item in the subscription is linked to a plan version: features, addons, etc.
    planVersionId: cuid("plan_version_id").notNull(),
    // TODO: support addons in other table
    type: typeSubscriptionEnum("type").default("plan").notNull(),

    // TODO: delete uncessesary stuff
    // prorate the subscription when the subscription is created in the middle of the billing period
    prorated: boolean("prorated").default(true),

    // ************ billing data defaults ************
    // this data normally comes from the plan version but we can override it when creating the subscription
    // whenToBill: pay_in_advance - pay_in_arrear
    whenToBill: whenToBillEnum("when_to_bill").default("pay_in_advance").notNull(),
    // when to start each cycle for this subscription -
    startCycle: integer("start_cycle").notNull().default(1).$type<StartCycle>(), // null means the first day of the month
    // a grace period of 1 day could handle edge cases when the payment is late for a few hours
    // TODO: change to grace period in days
    gracePeriod: integer("grace_period").notNull().default(1),
    // collection method for the subscription - charge_automatically or send_invoice
    collectionMethod: collectionMethodEnum("collection_method")
      .notNull()
      .default("charge_automatically"),
    // auto renew the subscription every billing period
    autoRenew: boolean("auto_renew").notNull().default(true),
    // ************ billing data defaults ************

    // If a user requests to change the plan, we mark the subscription to be changed at the next billing
    nextPlanVersionId: cuid("next_plan_version_id"),
    // next subscription id is the id of the subscription that will be created when the user changes the plan
    nextSubscriptionId: cuid("next_subscription_id"),
    timezone: varchar("timezone", { length: 32 }).notNull().default("UTC"),
    trialDays: integer("trial_days").notNull().default(0),

    // ************ subscription important dates ************
    // when the trial ends
    trialEndsAt: bigint("trial_ends_at_m", { mode: "number" }),
    // when the subscription starts
    startAt: bigint("start_at_m", { mode: "number" }).default(0).notNull(),
    // when the subscription ends
    endAt: bigint("end_at_m", { mode: "number" }),
    // billingCycleStartAt is the start time of the billing cycle
    billingCycleStartAt: bigint("billing_cycle_start_at_m", { mode: "number" }).notNull(),
    // billingCycleEndAt is the end time of the billing cycle
    billingCycleEndAt: bigint("billing_cycle_end_at_m", { mode: "number" }).notNull(),
    // when the subscription is going to be billed next
    nextInvoiceAt: bigint("next_invoice_at_m", { mode: "number" }).notNull(),
    lastChangePlanAt: bigint("last_change_plan_at_m", { mode: "number" }),
    // lastBilledAt is the last time the subscription was billed
    lastInvoiceAt: bigint("last_invoice_at_m", { mode: "number" }),
    // when the subscription was past due
    pastDueAt: bigint("past_due_at_m", { mode: "number" }),
    // when the subscription was changed
    changeAt: bigint("change_at_m", { mode: "number" }),
    // when the subscription was cancelled
    cancelAt: bigint("cancel_at_m", { mode: "number" }),
    // ************ subscription important dates ************

    // status of the subscription - active, inactive, canceled, paused, etc.
    status: subscriptionStatusEnum("status").notNull().default("active"),

    // whether the subscription is active or not
    // normally is active if the status is active, trialing or past_due
    // this simplifies the queries when we need to get the active subscriptions
    active: boolean("active").notNull().default(true),

    // metadata for the subscription
    metadata: json("metadata").$type<z.infer<typeof subscriptionMetadataSchema>>(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscriptions_pkey",
    }),
    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "subscriptions_customer_id_fkey",
    }),
    planversionfk: foreignKey({
      columns: [table.planVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "subscriptions_planversion_id_fkey",
    }),
    uniqueplansub: uniqueIndex("unique_active_planversion_subscription")
      .on(table.customerId, table.planVersionId, table.projectId)
      .where(eq(table.status, "active")),
  })
)

export const subscriptionItems = pgTableProject(
  "subscription_items",
  {
    ...projectID,
    ...timestamps,
    // how many units of the feature the user is subscribed to
    // null means the feature is usage based
    units: integer("units"),
    subscriptionId: cuid("subscription_id").notNull(),
    featurePlanVersionId: cuid("feature_plan_version_id").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscription_items_pkey",
    }),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "subscription_items_subscription_id_fkey",
    }).onDelete("cascade"),
    featurefk: foreignKey({
      columns: [table.featurePlanVersionId, table.projectId],
      foreignColumns: [planVersionFeatures.id, planVersionFeatures.projectId],
      name: "subscription_items_plan_version_id_fkey",
    }),
  })
)

export const billingCycleInvoices = pgTableProject(
  "billing_cycle_invoices",
  {
    ...projectID,
    ...timestamps,
    subscriptionId: cuid("subscription_id").notNull(),
    status: invoiceStatusEnum("status").notNull().default("unpaid"),
    billingCycleStartAt: bigint("billing_cycle_start_at_m", { mode: "number" }).notNull(),
    billingCycleEndAt: bigint("billing_cycle_end_at_m", { mode: "number" }).notNull(),
    // when the invoice was billed
    billedAt: bigint("billed_at_m", { mode: "number" }),
    // when the invoice is due
    dueAt: bigint("due_at_m", { mode: "number" }).notNull(),
    paidAt: bigint("paid_at_m", { mode: "number" }),
    type: invoiceTypeEnum("invoice_type").notNull().default("flat"),
    total: text("total").notNull(),
    invoiceUrl: text("invoice_url"),
    collectionMethod: collectionMethodEnum("collection_method")
      .notNull()
      .default("charge_automatically"),
    invoiceId: text("invoice_id"),
    paymentMethodId: text("payment_method_id"),
    whenToBill: whenToBillEnum("when_to_bill").default("pay_in_advance").notNull(),
    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    paymentProvider: paymentProviderEnum("payment_providers").notNull(),
    // currency of the plan
    currency: currencyEnum("currency").notNull(),
    gracePeriod: integer("grace_period").notNull().default(1),
    // when the subscription was past due
    pastDueAt: bigint("past_due_at_m", { mode: "number" }),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "billing_cycle_invoices_pkey",
    }),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "billing_cycle_invoices_subscription_id_fkey",
    }),
  })
)

export const subscriptionItemRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionItems.subscriptionId, subscriptionItems.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  featurePlanVersion: one(planVersionFeatures, {
    fields: [subscriptionItems.featurePlanVersionId, subscriptionItems.projectId],
    references: [planVersionFeatures.id, planVersionFeatures.projectId],
  }),
}))

export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  project: one(projects, {
    fields: [subscriptions.projectId],
    references: [projects.id],
  }),
  customer: one(customers, {
    fields: [subscriptions.customerId, subscriptions.projectId],
    references: [customers.id, customers.projectId],
  }),
  planVersion: one(versions, {
    fields: [subscriptions.planVersionId, subscriptions.projectId],
    references: [versions.id, versions.projectId],
  }),
  items: many(subscriptionItems),
}))
