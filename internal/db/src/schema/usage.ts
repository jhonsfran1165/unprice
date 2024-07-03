import { relations } from "drizzle-orm"
import { foreignKey, integer, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import { subscriptionItems } from "./subscriptions"

export const usage = pgTableProject(
  "usage",
  {
    ...projectID,
    ...timestamps,
    subscriptionItemId: text("subscription_item_id").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    usage: integer("usage").notNull(),
    limit: integer("limit"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "usage_pkey",
    }),
    subitemfk: foreignKey({
      columns: [table.subscriptionItemId, table.projectId],
      foreignColumns: [subscriptionItems.id, subscriptionItems.projectId],
      name: "usage_subitem_fkey",
    }),
    unique: uniqueIndex("unique_usage_subitem").on(
      table.projectId,
      table.subscriptionItemId,
      table.month,
      table.year
    ),
  })
)

export const usageRelations = relations(usage, ({ one }) => ({
  subscriptionItem: one(subscriptionItems, {
    fields: [usage.subscriptionItemId, usage.projectId],
    references: [subscriptionItems.id, subscriptionItems.projectId],
  }),
}))
