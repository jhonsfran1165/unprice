import { relations } from "drizzle-orm"
import {
  index,
  json,
  primaryKey,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core"
import * as z from "zod"

import { FEATURE_TYPES, TIER_MODES } from "../utils"
import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import { currencyEnum, statusPlanEnum, typeFeatureEnum } from "./enums"
import { projects } from "./projects"

export const configFlatFeature = z.object({
  price: z.coerce.number().min(0),
  divider: z.coerce
    .number()
    .min(0)
    .describe("Divider for the price. Could be number of days, hours, etc."),
})

export const configMeteredFeature = z.object({
  mode: z.enum(TIER_MODES),
  divider: z.coerce
    .number()
    .min(0)
    .describe("Divider for the price. Could be number of days, hours, etc."),
  tiers: z.array(
    z.object({
      price: z.coerce.number().min(0).describe("Price per unit"),
      up: z.coerce.number().min(0),
      flat: z.coerce.number().min(0),
    })
  ),
})

export const configHybridFeature = z.object({
  price: z.coerce.number().min(0),
})

export const featureSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(FEATURE_TYPES),
    groupId: z.string(),
    config: z.union([
      configFlatFeature,
      configMeteredFeature,
      configHybridFeature,
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "flat") {
      configFlatFeature.parse(data.config)
    } else if (data.type === "metered") {
      configMeteredFeature.parse(data.config)
    } else if (data.type === "hybrid") {
      configHybridFeature.parse(data.config)
    }
  })

export const versionPlanConfig = z.record(
  z.object({
    name: z.string(),
    features: z.array(featureSchema),
  })
)

export type PlanConfig = z.infer<typeof versionPlanConfig>

// export const stripe = pgTableProject(
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

export const plans = pgTableProject(
  "plans",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    title: varchar("title", { length: 50 }).notNull(),
    currency: currencyEnum("currency").default("EUR"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id],
    }),
    slug: index("slug").on(table.slug),
  })
)

export const versions = pgTableProject(
  "plan_versions",
  {
    ...projectID,
    ...timestamps,
    planId: cuid("plan_id").notNull(),
    version: serial("version").notNull(),
    featuresConfig: json("features_config").default({}).$type<PlanConfig>(), // config features of the plan
    addonsConfig: json("addons_config").default({}).$type<PlanConfig>(), // config addons of the plan
    status: statusPlanEnum("plan_version_status").default("draft"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id, table.planId, table.version],
    }),
  })
)

export const features = pgTableProject(
  "features",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull().unique(),
    title: varchar("title", { length: 50 }).notNull(),
    description: text("description"),
    type: typeFeatureEnum("type").default("flat"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id],
    }),
    slug: index("slug").on(table.slug),
  })
)

export const planRelations = relations(plans, ({ one, many }) => ({
  project: one(projects, {
    fields: [plans.projectId],
    references: [projects.id],
  }),
  versions: many(versions),
}))

export const featureRelations = relations(features, ({ one }) => ({
  project: one(projects, {
    fields: [features.projectId],
    references: [projects.id],
  }),
}))

export const versionRelations = relations(versions, ({ one }) => ({
  project: one(projects, {
    fields: [versions.projectId],
    references: [projects.id],
  }),
  plan: one(plans, {
    fields: [versions.planId],
    references: [plans.id],
  }),
}))
