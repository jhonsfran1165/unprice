import { relations } from "drizzle-orm"
import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"

import { subscriptionStatus } from "../../utils/enums"
import { cuid, projectID, tenantID, timestamps } from "../../utils/sql"
import { version } from "../price"
import { project } from "../project"
import { plan } from "./../price/price.sql"

export const user = pgTable(
  "user",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
  },
  (table) => ({
    userProjectInx: index("user_project_id_idx").on(table.projectId),
    userTenantIdInx: index("user_tenant_uidx").on(table.tenantId),
  })
)

export const subscription = pgTable(
  "subscription",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    planVersion: cuid("plan_version").notNull(),
    planId: text("plan_id").notNull(),
    userId: cuid("user_id").notNull(),
    status: subscriptionStatus("active").default("active"),
    // TODO: add fields for handling the subscription like date of start and end, stripe info
  },
  (table) => ({
    subscriptionProjectInx: index("subscription_project_id_idx").on(
      table.projectId
    ),
    subscriptionUniqueInx: uniqueIndex("subscription_unique_uidx").on(
      table.planId,
      table.planVersion,
      table.userId,
      table.projectId,
      table.tenantId
    ),
    subscriptionTenantIdInx: index("subscription_tenant_uidx").on(
      table.tenantId
    ),
  })
)

export const userRelations = relations(user, ({ one }) => ({
  project: one(project, {
    fields: [user.projectId],
    references: [project.id],
  }),
}))

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  project: one(project, {
    fields: [subscription.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
  version: one(version, {
    fields: [subscription.planVersion],
    references: [version.id],
  }),
  plan: one(plan, {
    fields: [subscription.planId],
    references: [plan.id],
  }),
}))
