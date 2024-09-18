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
  changeTypeEnum,
  changeTypeSubscriptionItemEnum,
  collectionMethodEnum,
  currencyEnum,
  invoiceStatusEnum,
  invoiceTypeEnum,
  paymentProviderEnum,
  statusSubChangesEnum,
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

    timezone: varchar("timezone", { length: 32 }).notNull().default("UTC"),
    trialDays: integer("trial_days").notNull().default(0),

    // ************ subscription important dates ************
    // when the trial ends
    trialEndsAt: bigint("trial_ends_at_m", { mode: "number" }),
    // when the subscription starts
    startAt: bigint("start_at_m", { mode: "number" }).default(0).notNull(),
    // when the subscription ends if undefined the subscription is active and renewed every cycle depending on auto_renew flag
    endAt: bigint("end_at_m", { mode: "number" }),
    // current cycle is updated every time the subscription is billed
    // currentCycleStartAt is the start time of the billing cycle
    currentCycleStartAt: bigint("current_cycle_start_at_m", { mode: "number" })
      .notNull()
      .default(0),
    // currentCycleEndAt is the end time of the billing cycle
    currentCycleEndAt: bigint("current_cycle_end_at_m", { mode: "number" }).notNull().default(0),
    // when the subscription is going to be billed next
    nextInvoiceAt: bigint("next_invoice_at_m", { mode: "number" }).notNull().default(0),
    // lastBilledAt is the last time the subscription was billed
    lastInvoiceAt: bigint("last_invoice_at_m", { mode: "number" }),
    // when the subscription is considered past due
    pastDueAt: bigint("past_due_at_m", { mode: "number" }),
    // when the subscription is going to be cancelled
    cancelAt: bigint("cancel_at_m", { mode: "number" }),
    // when the subscription was cancelled
    canceledAt: bigint("canceled_at_m", { mode: "number" }),
    // when the subscription is going to be changed
    changeAt: bigint("change_at_m", { mode: "number" }),
    // when the subscription was changed and the change was applied
    // this is useful for auditing the changes and to lock many changes on the subscription
    // normally we allow to change the plan every 30 days
    changedAt: bigint("changed_at_m", { mode: "number" }),
    // ************ subscription important dates ************

    // status of the subscription - active, inactive, canceled, paused, etc.
    status: subscriptionStatusEnum("status").notNull().default("active"),

    // whether the subscription is active or not
    // normally is active if the status is active, trialing or past_due or changing
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
    }).onDelete("cascade"),
    planversionfk: foreignKey({
      columns: [table.planVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "subscriptions_planversion_id_fkey",
    }).onDelete("cascade"),
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscriptions_project_id_fkey",
    }).onDelete("cascade"),
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
    }).onDelete("cascade"),
    // project fk
    // TODO: review this is used on all tables with delete cascade
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscription_items_project_id_fkey",
    }).onDelete("cascade"),
  })
)

export const billingCycleInvoices = pgTableProject(
  "billing_cycle_invoices",
  {
    ...projectID,
    ...timestamps,
    subscriptionId: cuid("subscription_id").notNull(),
    status: invoiceStatusEnum("status").notNull().default("unpaid"),
    currentCycleStartAt: bigint("billing_cycle_start_at_m", { mode: "number" }).notNull(),
    currentCycleEndAt: bigint("billing_cycle_end_at_m", { mode: "number" }).notNull(),
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
    }).onDelete("cascade"),
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "billing_cycle_invoices_project_id_fkey",
    }).onDelete("cascade"),
  })
)

// subscription_changes
export const subscriptionChanges = pgTableProject(
  "subscription_changes",
  {
    ...projectID,
    ...timestamps,
    subscriptionId: cuid("subscription_id").notNull(),
    previousPlanVersionId: cuid("previous_plan_version_id").notNull(),
    newPlanVersionId: cuid("new_plan_version_id").notNull(),
    status: statusSubChangesEnum("status").notNull().default("pending"),
    changeAt: bigint("change_at_m", { mode: "number" }).notNull(),
    appliedAt: bigint("applied_at_m", { mode: "number" }),
    changeType: changeTypeEnum("change_type").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscription_changes_pkey",
    }),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "subscription_changes_subscription_id_fkey",
    }).onDelete("cascade"),
    // plan version fk
    previousPlanVersionfk: foreignKey({
      columns: [table.previousPlanVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "subscription_changes_previous_plan_version_id_fkey",
    }).onDelete("cascade"),
    newPlanVersionfk: foreignKey({
      columns: [table.newPlanVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "subscription_changes_new_plan_version_id_fkey",
    }).onDelete("cascade"),
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscription_changes_project_id_fkey",
    }).onDelete("cascade"),
    // unique index to avoid having multiple changes for the same subscription
    uniqueSubscriptionChange: uniqueIndex("unique_subscription_change")
      .on(table.subscriptionId, table.projectId)
      .where(eq(table.status, "pending")),
  })
)

// subscription_item_changes
export const subscriptionItemChanges = pgTableProject(
  "subscription_item_changes",
  {
    ...projectID,
    ...timestamps,
    subscriptionChangeId: cuid("subscription_change_id").notNull(),
    subscriptionItemId: cuid("subscription_item_id"),
    previousFeaturePlanVersionId: cuid("previous_feature_plan_version_id"),
    newFeaturePlanVersionId: cuid("new_feature_plan_version_id").notNull(),
    changeAt: bigint("change_at_m", { mode: "number" }).notNull(),
    appliedAt: bigint("applied_at_m", { mode: "number" }),
    changeType: changeTypeSubscriptionItemEnum("change_type").notNull(),
    status: statusSubChangesEnum("status").notNull().default("pending"),
    previousUnits: integer("previous_units"),
    newUnits: integer("new_units"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscription_item_changes_pkey",
    }),
    subscriptionChangefk: foreignKey({
      columns: [table.subscriptionChangeId, table.projectId],
      foreignColumns: [subscriptionChanges.id, subscriptionChanges.projectId],
      name: "subscription_item_changes_subscription_change_id_fkey",
    }).onDelete("cascade"),
    subscriptionItemfk: foreignKey({
      columns: [table.subscriptionItemId, table.projectId],
      foreignColumns: [subscriptionItems.id, subscriptionItems.projectId],
      name: "subscription_item_changes_subscription_item_id_fkey",
    }).onDelete("cascade"),
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscription_item_changes_project_id_fkey",
    }).onDelete("cascade"),
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

export const billingCycleInvoiceRelations = relations(billingCycleInvoices, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [billingCycleInvoices.subscriptionId, billingCycleInvoices.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  project: one(projects, {
    fields: [billingCycleInvoices.projectId],
    references: [projects.id],
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

export const subscriptionChangeRelations = relations(subscriptionChanges, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionChanges.subscriptionId, subscriptionChanges.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  project: one(projects, {
    fields: [subscriptionChanges.projectId],
    references: [projects.id],
  }),
  previousPlanVersion: one(versions, {
    fields: [subscriptionChanges.previousPlanVersionId, subscriptionChanges.projectId],
    references: [versions.id, versions.projectId],
  }),
  newPlanVersion: one(versions, {
    fields: [subscriptionChanges.newPlanVersionId, subscriptionChanges.projectId],
    references: [versions.id, versions.projectId],
  }),
  itemsChanges: many(subscriptionItemChanges),
}))
