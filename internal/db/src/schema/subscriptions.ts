import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { cuid, timestamps } from "../utils/fields"
import { projectID } from "../utils/sql"
import type {
  invoiceMetadataSchema,
  subscriptionMetadataSchema,
  subscriptionPhaseMetadataSchema,
} from "../validators/subscriptions"
import { customerCredits, customerEntitlements, customers } from "./customers"
import {
  collectionMethodEnum,
  currencyEnum,
  invoiceStatusEnum,
  invoiceTypeEnum,
  paymentProviderEnum,
  subscriptionStatusEnum,
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
    status: subscriptionStatusEnum("status").notNull().default("idle"),

    // whether the subscription is active or not
    // normally is active if the status is active, trialing or past_due or changing
    // this simplifies the queries when we need to get the active subscriptions
    active: boolean("active").notNull().default(false),
    // slug of the plan only for ui purposes
    planSlug: text("plan_slug").default("FREE"),
    timezone: varchar("timezone", { length: 32 }).notNull().default("UTC"),

    // whether the subscription is locked or not
    // this is used to avoid race conditions when multiple machines are started at the same time
    locked: boolean("locked").notNull().default(false),
    lockedAt: bigint("locked_at_m", { mode: "number" }),

    // ************ subscription important dates ************
    // current cycle dates for invoices purposes
    currentCycleStartAt: bigint("current_cycle_start_at_m", { mode: "number" }).notNull(),
    currentCycleEndAt: bigint("current_cycle_end_at_m", { mode: "number" }).notNull(),
    previousCycleStartAt: bigint("previous_cycle_start_at_m", { mode: "number" }),
    previousCycleEndAt: bigint("previous_cycle_end_at_m", { mode: "number" }),
    // when the subscription is going to be billed next
    invoiceAt: bigint("invoice_at_m", { mode: "number" }).notNull().default(0),
    // renewAt indicates the next time the subscription will be renewed
    renewAt: bigint("renew_at_m", { mode: "number" }).notNull().default(0),
    // endAt is the date when the subscription will end
    endAt: bigint("end_at_m", { mode: "number" }),
    // when the subscription is going to be billed next
    lastRenewAt: bigint("last_renew_at_m", { mode: "number" }).notNull().default(0),
    // when the subscription is going to be billed next
    lastInvoiceAt: bigint("last_invoice_at_m", { mode: "number" }).notNull().default(0),
    // ************ subscription important dates ************
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
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscriptions_project_id_fkey",
    }).onDelete("cascade"),
  })
)

// every phase represents a phase of the subscription where the billing period and currency is the same
// on every change of the plan we enter a new phase so we can have a history of the changes
// also this way we can schedule future changes and so on. Only one phase can be active at the time
export const subscriptionPhases = pgTableProject(
  "subscription_phases",
  {
    ...projectID,
    ...timestamps,
    subscriptionId: cuid("subscription_id").notNull(),
    planVersionId: cuid("plan_version_id").notNull(),
    // payment method id of the customer - if not set, the first payment method will be used
    // payment method is tied to the phase because it's tied to the plan version payment provider
    paymentMethodId: text("payment_method_id"),
    // trial days of the phase
    trialDays: integer("trial_days").notNull().default(0),
    // billing anchor of the phase
    billingAnchor: integer("billing_anchor").notNull().default(0), // 0 means not applicable
    // ************ subscription important dates ************
    // when the trial ends
    trialEndsAt: bigint("trial_ends_at_m", { mode: "number" }),
    // when the subscription starts
    startAt: bigint("start_at_m", { mode: "number" }).notNull(),
    // when the subscription ends if undefined the subscription is active and renewed every cycle depending on auto_renew flag
    endAt: bigint("end_at_m", { mode: "number" }),
    // ************ subscription important dates ************
    metadata: json("metadata").$type<z.infer<typeof subscriptionPhaseMetadataSchema>>(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscription_phases_pkey",
    }),
    planVersionfk: foreignKey({
      columns: [table.planVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "subscription_phases_plan_version_id_fkey",
    }).onDelete("cascade"),
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscription_phases_project_id_fkey",
    }).onDelete("cascade"),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "subscription_phases_subscription_id_fkey",
    }).onDelete("cascade"),
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
    featurePlanVersionId: cuid("feature_plan_version_id").notNull(),
    subscriptionPhaseId: cuid("subscription_phase_id").notNull(),
    subscriptionId: cuid("subscription_id").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "subscription_items_pkey",
    }),
    featurefk: foreignKey({
      columns: [table.featurePlanVersionId, table.projectId],
      foreignColumns: [planVersionFeatures.id, planVersionFeatures.projectId],
      name: "subscription_items_plan_version_id_fkey",
    }).onDelete("cascade"),
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "subscription_items_project_id_fkey",
    }).onDelete("cascade"),
    subscriptionPhasefk: foreignKey({
      columns: [table.subscriptionPhaseId, table.projectId],
      foreignColumns: [subscriptionPhases.id, subscriptionPhases.projectId],
      name: "subscription_items_subscription_phase_id_fkey",
    }).onDelete("cascade"),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "subscription_items_subscription_id_fkey",
    }).onDelete("cascade"),
  })
)

export const invoices = pgTableProject(
  "invoices",
  {
    ...projectID,
    ...timestamps,
    // Is it necessary to have the subscription id?
    subscriptionId: cuid("subscription_id").notNull(),
    subscriptionPhaseId: cuid("subscription_phase_id").notNull(),
    requiredPaymentMethod: boolean("required_payment_method").notNull().default(false),
    paymentMethodId: text("payment_method_id"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    // type of invoice charges (flat, usage, hybrid)
    type: invoiceTypeEnum("type").notNull().default("hybrid"),
    cycleStartAt: bigint("cycle_start_at_m", { mode: "number" }).notNull(),
    cycleEndAt: bigint("cycle_end_at_m", { mode: "number" }).notNull(),
    // previous cycle dates for invoices purposes
    previousCycleStartAt: bigint("previous_cycle_start_at_m", { mode: "number" }),
    previousCycleEndAt: bigint("previous_cycle_end_at_m", { mode: "number" }),
    // sent at is the date when the invoice was sent to the customer
    sentAt: bigint("sent_at_m", { mode: "number" }),
    prorated: boolean("prorated").notNull().default(false),
    whenToBill: whenToBillEnum("when_to_bill").notNull().default("pay_in_advance"),
    paymentAttempts:
      json("payment_attempts").$type<
        {
          status: string
          createdAt: number
        }[]
      >(),
    // when the invoice is due and ready to be billed
    dueAt: bigint("due_at_m", { mode: "number" }).notNull(),
    paidAt: bigint("paid_at_m", { mode: "number" }),
    // ----------------- amounts --------------------------------
    // amount in cents, these are not used for the calculations only to keep track of the amounts
    // the invoice from the payment provider will have the calculations
    // invoices can have credits applied to them
    customerCreditId: cuid("customer_credit_id"),
    // amount of the credit used to pay the invoice
    amountCreditUsed: integer("amount_credit_used").default(0),
    // subtotal of the invoice before the credit is applied
    subtotal: integer("subtotal").default(0).notNull(),
    // total amount of the invoice after the credit is applied
    total: integer("total").default(0).notNull(),
    // ----------------- amounts --------------------------------
    collectionMethod: collectionMethodEnum("collection_method")
      .notNull()
      .default("charge_automatically"),
    invoicePaymentProviderId: text("invoice_payment_provider_id"),
    invoicePaymentProviderUrl: text("invoice_payment_provider_url"),
    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    paymentProvider: paymentProviderEnum("payment_providers").notNull(),
    // currency of the plan
    currency: currencyEnum("currency").notNull(),
    // when the subscription is considered past due
    pastDueAt: bigint("past_due_at_m", { mode: "number" }).notNull(),
    metadata: json("metadata").$type<z.infer<typeof invoiceMetadataSchema>>(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "invoices_pkey",
    }),
    subscriptionfk: foreignKey({
      columns: [table.subscriptionId, table.projectId],
      foreignColumns: [subscriptions.id, subscriptions.projectId],
      name: "invoices_subscription_id_fkey",
    }).onDelete("cascade"),
    subscriptionPhasefk: foreignKey({
      columns: [table.subscriptionPhaseId, table.projectId],
      foreignColumns: [subscriptionPhases.id, subscriptionPhases.projectId],
      name: "invoices_subscription_phase_id_fkey",
    }).onDelete("cascade"),
    // project fk
    projectfk: foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "invoices_project_id_fkey",
    }).onDelete("cascade"),
    customerCreditfk: foreignKey({
      columns: [table.customerCreditId, table.projectId],
      foreignColumns: [customerCredits.id, customerCredits.projectId],
      name: "invoices_customer_credit_id_fkey",
    }).onDelete("cascade"),
  })
)

export const subscriptionItemRelations = relations(subscriptionItems, ({ one }) => ({
  featurePlanVersion: one(planVersionFeatures, {
    fields: [subscriptionItems.featurePlanVersionId, subscriptionItems.projectId],
    references: [planVersionFeatures.id, planVersionFeatures.projectId],
  }),
  subscriptionPhase: one(subscriptionPhases, {
    fields: [subscriptionItems.subscriptionPhaseId, subscriptionItems.projectId],
    references: [subscriptionPhases.id, subscriptionPhases.projectId],
  }),
}))

export const invoiceRelations = relations(invoices, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId, invoices.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  subscriptionPhase: one(subscriptionPhases, {
    fields: [invoices.subscriptionPhaseId, invoices.projectId],
    references: [subscriptionPhases.id, subscriptionPhases.projectId],
  }),
  customerCredit: one(customerCredits, {
    fields: [invoices.customerCreditId, invoices.projectId],
    references: [customerCredits.id, customerCredits.projectId],
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
  phases: many(subscriptionPhases),
  customerEntitlements: many(customerEntitlements),
}))

export const subscriptionPhaseRelations = relations(subscriptionPhases, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionPhases.subscriptionId, subscriptionPhases.projectId],
    references: [subscriptions.id, subscriptions.projectId],
  }),
  project: one(projects, {
    fields: [subscriptionPhases.projectId],
    references: [projects.id],
  }),
  planVersion: one(versions, {
    fields: [subscriptionPhases.planVersionId, subscriptionPhases.projectId],
    references: [versions.id, versions.projectId],
  }),
  items: many(subscriptionItems),
  customerEntitlements: many(customerEntitlements),
}))
