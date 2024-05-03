import { eq, relations } from "drizzle-orm"
import {
  boolean,
  date,
  foreignKey,
  integer,
  json,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import { customers } from "./customers"
import { subscriptionStatusEnum } from "./enums"
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

    // entitlements of the subscription are calculated based on the items inside the subscription
    // TODO: add types for the entitlements
    entitlements: json("entitlements").default([]),

    // subscription trial period
    // TODO: transform to unix timestamp
    trialsEnd: date("trials_end"),
    startDate: date("start_date"),
    endDate: date("end_date"),

    // auto renew the subscription every billing period
    autoRenew: boolean("auto_renew").default(true),

    // data from plan version when the subscription was created
    billingPeriod: text("billing_period").notNull(),
    startCycle: text("start_cycle").notNull(),
    gracePeriod: integer("grace_period").default(0),
    type: text("type").notNull(),
    currency: text("currency").notNull(),
    // payment provider configured for the plan. This should not changed after the subscription is created
    paymentProviderId: text("payment_provider_id").notNull(),

    // TODO: add enum for the collection method
    collectionMethod: text("collection_method").default("charge_automatically"),
    // whether the subscription is new or not. New means that the subscription was created in the current billing period
    isNew: boolean("is_new").default(true),
    // metadata for the subscription
    metadata: json("metadata").default({}),
    // plan change means that the customer has changed the plan in the current billing period. This is used to calculate the proration, entitlements, etc from billing period to billing period
    planChanged: boolean("plan_changed").default(false),
    // status of the subscription - active, inactive, canceled, paused, etc.
    status: subscriptionStatusEnum("status").default("active"),
    // item type could be plan, addon, etc.
    // TODO: add enum for this
    itemType: text("item_type").notNull(),
    // id of the item the customer is subscribed to
    // item id allows to create multiple items in a same invoice for the same customer. eg. plan, addons, etc.
    // we could use this to enforce limits on the number of items in the subscription
    // item id is used in conjunction with the item type to get the item details when creating the invoice
    // that way we can get the price, currency, etc. of the item
    itemId: text("item_id").notNull(), // could be a version plan id, addon id, etc.
    // TODO: how to handle payments? as a separated table?
    // we somehow should support addons here as well?
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
    unique: uniqueIndex("unique_active_subscription")
      .on(table.customerId)
      .where(eq(table.status, "active")),
  })
)

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  project: one(projects, {
    fields: [subscriptions.projectId],
    references: [projects.id],
  }),
  customer: one(customers, {
    fields: [subscriptions.customerId, subscriptions.projectId],
    references: [customers.id, customers.projectId],
  }),
}))
