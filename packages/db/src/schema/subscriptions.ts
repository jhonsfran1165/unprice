import { eq, relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import type {
  subscriptionItemsSchema,
  subscriptionMetadataSchema,
} from "../validators/subscription"
import { customers } from "./customers"
import {
  collectionMethodEnum,
  subscriptionStatusEnum,
  typeSubscriptionEnum,
} from "./enums"
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

    // data from plan version when the subscription was created
    // payment provider configured for the plan. This should not changed after the subscription is created
    // plan version has the payment provider configured, currency and all the other data needed to create the invoice
    // every item in the subscription is linked to a plan version: features, addons, etc.
    planVersionId: cuid("plan_version_id").notNull(),
    // TODO: support addons - every addon should have a subscription
    // addonId: cuid("addon_id"),
    type: typeSubscriptionEnum("type").default("plan").notNull(),

    // subscription trial period
    // TODO: I can configure this from the plan version
    // TODO: we could override this when creating the subscription, otherwise use planVersion data
    trialDays: integer("trial_days").default(0),
    trialEnds: timestamp("trial_ends", {
      mode: "date",
    }),
    startDate: timestamp("start_date", {
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    endDate: timestamp("end_date", {
      mode: "date",
    }),

    // auto renew the subscription every billing period
    autoRenew: boolean("auto_renew").default(true),

    collectionMethod: collectionMethodEnum("collection_method").default(
      "charge_automatically"
    ),
    // whether the subscription is new or not. New means that the subscription was created in the current billing period
    isNew: boolean("is_new").default(true),

    // TODO: support plan changes
    // plan change means that the customer has changed the plan in the current billing period. This is used to calculate the proration, entitlements, etc from billing period to billing period
    // planChanged: boolean("plan_changed").default(false),

    // status of the subscription - active, inactive, canceled, paused, etc.
    status: subscriptionStatusEnum("status").default("active"),

    // items information for the subscription - can be features or addons information
    // if null means that the subscription is for the whole plan
    items: json("items")
      .$type<z.infer<typeof subscriptionItemsSchema>>()
      .notNull(),

    // TODO: create invoice table

    // metadata for the subscription
    metadata:
      json("metadata").$type<z.infer<typeof subscriptionMetadataSchema>>(),
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

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
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
}))
