import { relations } from "drizzle-orm"
import {
  index,
  integer,
  json,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import { currencyEnum } from "../../utils/enums"
import { projectID, tenantID, timestamps } from "../../utils/sql"
import { project } from "../project"

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
//     planProjectInx: index("plan_project_id_idx").on(table.projectId),
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
    planProjectInx: index("plan_project_id_idx").on(table.projectId),
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
    features: json("features"), // array of config features
    addons: json("features"), // array of config features
  },
  (table) => ({
    versionProjectInx: index("version_project_id_idx").on(table.projectId),
    versionInx: uniqueIndex("version_key_slug").on(table.slug),
    versionTenantIdInx: index("version_tenant_uidx").on(table.tenantId),
  })
)

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
    featureProjectInx: index("feature_project_id_idx").on(table.projectId),
    featureInx: uniqueIndex("feature_key_slug").on(table.slug),
    featureTenantIdInx: index("feature_tenant_uidx").on(table.tenantId),
  })
)

export const planRelations = relations(plan, ({ one }) => ({
  project: one(project, {
    fields: [plan.projectId],
    references: [project.id],
  }),
}))

export const featureRelations = relations(feature, ({ one }) => ({
  project: one(project, {
    fields: [feature.projectId],
    references: [project.id],
  }),
}))

export const versionRelations = relations(version, ({ one }) => ({
  project: one(project, {
    fields: [version.projectId],
    references: [project.id],
  }),
}))
