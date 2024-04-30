import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
  serial,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core"
import type * as z from "zod"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import type {
  planVersionFeatureSchema,
  StartCycleType,
} from "../validators/planVersions"
import {
  currencyEnum,
  planBillingPeriodEnum,
  statusPlanEnum,
  whenToBillEnum,
} from "./enums"
import { plans } from "./plans"
import { projects } from "./projects"
import { subscriptions } from "./subscriptions"

// plan_versions are the different versions of the plan
// each version can have different features and configurations
// this allows to handle different currencies, billing periods, etc.
// the idea with versions is the user can create a new version of the plan and publish it,
// this way the customers can subscribe to the new version of the plan
// versions are immutable, once created they can't be changed, also a version is a way to iterate on the plan
// and add new features, configurations, etc. without affecting the existing customers
// this allows pricing experiments, etc.
export const versions = pgTableProject(
  "plan_versions",
  {
    ...projectID,
    ...timestamps,
    planId: cuid("plan_id").notNull(),
    // description of the plan version
    description: text("description"),
    // version number of the plan, is a sequential number
    version: serial("version").notNull().unique(),
    // whether this is the latest version of the plan for the given currency
    latest: boolean("latest").default(false),
    // title of the version, this is useful for multiple languages. eg. "Basic Plan", "Plan Basico"
    title: varchar("title", { length: 50 }).notNull(),
    // active: whether the plan version is active or not, if not active, it won't be available for purchase
    active: boolean("active").default(true),
    // tags for the plan, this could be used for filtering
    tags: json("tags").$type<string[]>(),
    // currency of the plan
    currency: currencyEnum("currency").notNull().default("EUR"),
    // whenToBill: pay_in_advance - pay_in_arrear
    whenToBill: whenToBillEnum("when_to_bill").default("pay_in_advance"),
    // billingPeriod: billing_period - billing_cycle, only used for recurring plans, only used for recurring plans
    billingPeriod: planBillingPeriodEnum("billing_period"),
    // when to start each cycle for this subscription - not used for now, only used for recurring plans
    startCycle: text("start_cycle").$type<StartCycleType>().default(null), // null means the first day of the month
    // used for generating invoices - not used for now, only used for recurring plans
    gracePeriod: integer("grace_period").default(0), // 0 means no grace period to pay the invoice
    // status of the plan version - draft, active, inactive, published
    status: statusPlanEnum("plan_version_status").default("draft"),
    // features of the plan, each feature can have different configurations
    // a feature is treated as a product that can be sold. This also allows to set the entitlements in the subscription
    featuresConfig:
      json("features_config").$type<
        z.infer<typeof planVersionFeatureSchema>[]
      >(),
  },
  (table) => ({
    planfk: foreignKey({
      columns: [table.planId, table.projectId],
      foreignColumns: [plans.id, plans.projectId],
      name: "plan_versions_plan_id_fkey",
    }),
    pk: primaryKey({
      columns: [table.id, table.projectId],
      name: "plan_versions_pkey",
    }),
    unique: unique("unique_version").on(
      table.planId,
      table.projectId,
      table.currency,
      table.version
    ),
  })
)

export const versionRelations = relations(versions, ({ one, many }) => ({
  project: one(projects, {
    fields: [versions.projectId],
    references: [projects.id],
  }),
  plan: one(plans, {
    fields: [versions.planId],
    references: [plans.id],
  }),
  subscriptions: many(subscriptions),
}))
