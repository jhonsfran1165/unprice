import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
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
} from "../validators/plans"
import {
  currencyEnum,
  planBillingPeriodEnum,
  planTypeEnum,
  statusPlanEnum,
} from "./enums"
import { projects } from "./projects"
import { subscriptions } from "./subscriptions"

// plans are the different plans that a project can have - e.g. free, basic, premium
// it helps to group the different versions of the plan
export const plans = pgTableProject(
  "plans",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    // whether the plan is active or not, if not active, it won't be available for purchase
    // this is useful for plans that are not available anymore
    active: boolean("active").default(true),
    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    // TODO: this should be a list of providers that the project has configured
    paymentProvider: text("payment_provider").default("stripe"),
    description: text("description"),
    // type of the plan - recurring, one-time, etc.
    type: planTypeEnum("plan_type").default("recurring"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plans_pkey",
    }),
    slug: unique("slug_plan").on(table.slug, table.projectId),
  })
)

// plan_versions are the different versions of the plan
// each version can have different features and configurations
// this allows to handle different currencies, billing periods, etc.
export const versions = pgTableProject(
  "plan_versions",
  {
    ...projectID,
    ...timestamps,
    planId: cuid("plan_id").notNull(),
    // description
    description: text("description"),
    // version number of the plan, is a sequential number
    version: integer("version").notNull(),
    // whether this is the latest version of the plan for the currency
    latest: boolean("latest").default(false),
    // title of the version, this is useful for multiple languages. eg. "Basic Plan", "Plan Basico"
    title: varchar("title", { length: 50 }).notNull(),
    // tags for the plan, this could be used for filtering
    tags: json("tags").$type<string[]>(),
    // currency of the plan
    currency: currencyEnum("currency").default("EUR"),
    // payOption: pay_in_advance - pay_in_arrear
    // billingPeriod: billing_period - billing_cycle, only used for recurring plans
    billingPeriod: planBillingPeriodEnum("billing_period"),
    // when to start each cycle for this subscription - not used for now, only used for recurring plans
    startCycle: text("start_cycle").$type<StartCycleType>().default(1), // 1 - first day of the month
    // used for generating invoices - not used for now, only used for recurring plans
    gracePeriod: integer("grace_period").default(0),
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
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plan_versions_pkey",
    }),
    unique: unique("unique_version").on(
      table.planId,
      table.currency,
      table.version
    ),
  })
)

export const planRelations = relations(plans, ({ one, many }) => ({
  project: one(projects, {
    fields: [plans.projectId],
    references: [projects.id],
  }),
  versions: many(versions),
}))

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
