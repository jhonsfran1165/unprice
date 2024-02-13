import { relations } from "drizzle-orm"
import { primaryKey, text } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import { customers } from "./customers"
import { subscriptionStatusEnum } from "./enums"
import { plans, versions } from "./prices"
import { projects } from "./projects"

export const subscriptions = pgTableProject(
  "subscriptions",
  {
    ...projectID,
    ...timestamps,
    planVersionId: cuid("plan_version_id").notNull(),
    planId: text("plan_id").notNull(),
    customerId: cuid("customers_id").notNull(),
    status: subscriptionStatusEnum("subscription_status").default("active"),
    // TODO: add fields for handling the subscription like date of start and end, stripe info
  },
  (table) => ({
    primary: primaryKey({
      columns: [
        table.planId,
        table.planVersionId,
        table.customerId,
        table.projectId,
      ],
    }),
  })
)

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  project: one(projects, {
    fields: [subscriptions.projectId],
    references: [projects.id],
  }),
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  version: one(versions, {
    fields: [subscriptions.planVersionId],
    references: [versions.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}))
