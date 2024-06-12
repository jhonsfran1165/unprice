import { relations } from "drizzle-orm"
import { boolean, foreignKey, index, text, unique } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, projectID, timestamps } from "../utils/sql"
import { customers } from "./customers"
import { currencyEnum, projectTierEnum } from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
import { subscriptionItems } from "./subscriptions"
import { workspaces } from "./workspaces"

export const usage = pgTableProject(
  "usage",
  {
    ...projectID,
    ...timestamps,
    customerId: text("customer_id").notNull(),
    subscriptionItemId: text("subscription_item_id").notNull(),
    month: text("month").notNull(),
    year: text("year").notNull(),
    usage: text("usage").notNull(),
  },
  (table) => ({
    slug: index("usage_customer_index").on(table.customerId),
    subitemfk: foreignKey({
      columns: [table.subscriptionItemId, table.projectId],
      foreignColumns: [subscriptionItems.id, subscriptionItems.projectId],
      name: "usage_subitem_fkey",
    }),
    customerfk: foreignKey({
      columns: [table.customerId, table.projectId],
      foreignColumns: [customers.id, customers.projectId],
      name: "usage_customer_fkey",
    }),
  })
)

export const usageRelations = relations(usage, ({ one }) => ({
  customer: one(customers, {
    fields: [usage.customerId, usage.projectId],
    references: [customers.id, customers.projectId],
  }),
  subscriptionItem: one(subscriptionItems, {
    fields: [usage.subscriptionItemId, usage.projectId],
    references: [subscriptionItems.id, subscriptionItems.projectId],
  }),
}))
