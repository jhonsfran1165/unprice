import { relations } from "drizzle-orm"
import {
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { projectID, tenantID, timestamps } from "../../utils/sql"
import { project } from "../project"

export const currencyEnum = pgEnum("currency", ["USD", "EUR", "GBP"])
export const stageEnum = pgEnum("stage", ["prod", "test", "dev"])

// export const stripe = pgTable(
//   "stripe",
//   {
//     ...projectID,
//     ...tenantID,
//     ...timestamps,
//     slug: text("slug").notNull().unique(),
//     token: text("token").notNull().unique(),
//     stage: stageEnum("stage").default("dev"),
//   },
//   (table) => ({
//     planProjectInx: uniqueIndex("plan_project_id_idx").on(table.projectId),
//     planInx: uniqueIndex("plan_key_slug").on(table.slug),
//     planTenantIdInx: index("plan_tenant_uidx").on(table.tenantId),
//   })
// )

export const plan = pgTable(
  "plans",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    title: varchar("title", { length: 50 }).notNull(),
    currency: currencyEnum("currency").default("EUR"),
  },
  (table) => ({
    planProjectInx: uniqueIndex("plan_project_id_idx").on(table.projectId),
    planInx: uniqueIndex("plan_key_slug").on(table.slug),
    planTenantIdInx: index("plan_tenant_uidx").on(table.tenantId),
  })
)

export const version = pgTable(
  "version",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id),
    slug: text("slug").notNull().unique(),
    version: integer("version").notNull().unique().default(1),
    features: json("features"), // array of feature ids
    addons: json("features"), // array of feature ids
  },
  (table) => ({
    versionProjectInx: uniqueIndex("version_project_id_idx").on(
      table.projectId
    ),
    versionInx: uniqueIndex("version_key_slug").on(table.slug),
    versionTenantIdInx: uniqueIndex("version_tenant_uidx").on(table.tenantId),
  })
)

export const typeFeatureEnum = pgEnum("type", ["flat", "metered", "hybrid"])

export const feature = pgTable(
  "feature",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    title: varchar("title", { length: 50 }).notNull(),
  },
  (table) => ({
    featureProjectInx: uniqueIndex("feature_project_id_idx").on(
      table.projectId
    ),
    featureInx: uniqueIndex("feature_key_slug").on(table.slug),
    featureTenantIdInx: uniqueIndex("feature_tenant_uidx").on(table.tenantId),
  })
)

export const planRelations = relations(plan, ({ one }) => ({
  project: one(project, {
    fields: [plan.projectId],
    references: [project.id],
  }),
}))
