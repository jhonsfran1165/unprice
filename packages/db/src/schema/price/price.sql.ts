import { relations } from "drizzle-orm"
import {
  index,
  json,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

import {
  currencyEnum,
  statusPlanEnum,
  typeFeatureEnum,
} from "../../utils/enums"
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

// TODO: add schema to the versions features
export const version = pgTable(
  "plan_version",
  {
    ...projectID,
    ...tenantID,
    ...timestamps,
    planId: text("plan_id")
      .notNull()
      .references(() => plan.id),
    version: serial("version").notNull(),
    featuresPlan: json("features_plan"), // config features of the plan
    addonsPlan: json("addons_plan"), // config addons of the plan
    status: statusPlanEnum("status").default("draft"),
  },
  (table) => ({
    versionProjectInx: index("version_project_id_idx").on(table.projectId),
    versionInx: uniqueIndex("version_unique_plan").on(
      table.planId,
      table.version
    ),
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
    description: text("description"),
    type: typeFeatureEnum("type").default("flat"),
  },
  (table) => ({
    featureProjectInx: index("feature_project_id_idx").on(table.projectId),
    featureInx: uniqueIndex("feature_key_slug").on(table.slug),
    featureTenantIdInx: index("feature_tenant_uidx").on(table.tenantId),
  })
)

export const planRelations = relations(plan, ({ one, many }) => ({
  project: one(project, {
    fields: [plan.projectId],
    references: [project.id],
  }),
  versions: many(version),
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
  plan: one(plan, {
    fields: [version.planId],
    references: [plan.id],
  }),
}))
