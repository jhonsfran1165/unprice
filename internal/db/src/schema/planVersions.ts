import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  integer,
  json,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import type { PlanVersionMetadata, StartCycleType } from "../validators/planVersions"
import { users } from "./auth"
import {
  currencyEnum,
  paymentProviderEnum,
  planBillingPeriodEnum,
  planTypeEnum,
  statusPlanEnum,
  whenToBillEnum,
} from "./enums"
import { planVersionFeatures } from "./planVersionFeatures"
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

    // basic information of the plan version
    planId: cuid("plan_id").notNull(),
    // description of the plan version
    description: text("description"),
    // whether this is the latest version of the plan for the given currency, payment provider, plan type, and plan id
    latest: boolean("latest").default(false),
    // title of the version, this is useful for multiple languages. eg. "Basic Plan", "Plan Basico"
    title: varchar("title", { length: 50 }).notNull(),
    // tags for the plan, this could be used for filtering - we don't use metadata to save this
    // because we want to improve the search performance, and searching in metadata is not efficient
    tags: json("tags").$type<string[]>(),

    // handling status of the plan version
    // active: whether the plan version is active or not, if not active, it won't be available for purchase
    active: boolean("active").default(true),

    // status of the plan version - draft, published
    status: statusPlanEnum("plan_version_status").default("draft"),
    // date when the plan version was published
    publishedAt: timestamp("published_at", { mode: "date" }),
    // user that published the plan version
    publishedBy: cuid("published_by").references(() => users.id),
    // the customers have been migrated to a new version
    archived: boolean("archived").default(false),
    archivedAt: timestamp("archived_at", { mode: "date" }),
    archivedBy: cuid("archived_by").references(() => users.id),

    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    paymentProvider: paymentProviderEnum("payment_providers").notNull(),
    // type of the plan - recurring, one-time, etc.
    // the idea is to support different types of plans in the future
    // and compere which one is more useful for the business
    // TODO: add more types for now only support recurring
    planType: planTypeEnum("plan_type").default("recurring").notNull(),

    // handle billing data
    // currency of the plan
    currency: currencyEnum("currency").notNull(),
    // whenToBill: pay_in_advance - pay_in_arrear
    whenToBill: whenToBillEnum("when_to_bill").default("pay_in_advance"),
    // billingPeriod: billing_period - billing_cycle, only used for recurring plans, only used for recurring plans
    billingPeriod: planBillingPeriodEnum("billing_period"),
    // when to start each cycle for this subscription - not used for now, only used for recurring plans
    startCycle: text("start_cycle").$type<StartCycleType>().default(null), // null means the first day of the month
    // used for generating invoices - not used for now, only used for recurring plans
    gracePeriod: integer("grace_period").default(0), // 0 means no grace period to pay the invoice

    // metadata probably will be useful to save external data, etc.
    metadata: json("metadata").$type<PlanVersionMetadata>(),

    version: integer("version").default(1).notNull(),
  },
  (table) => ({
    planfk: foreignKey({
      columns: [table.planId, table.projectId],
      foreignColumns: [plans.id, plans.projectId],
      name: "plan_versions_plan_id_pkey",
    }),
    pk: primaryKey({
      columns: [table.id, table.projectId],
      name: "plan_versions_plan_id_fkey",
    }),
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
  planFeatures: many(planVersionFeatures),
  subscriptions: many(subscriptions),
}))
