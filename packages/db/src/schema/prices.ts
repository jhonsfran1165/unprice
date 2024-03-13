import { relations } from "drizzle-orm"
import {
  foreignKey,
  json,
  primaryKey,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import * as z from "zod"

import { FEATURE_TYPES, TIER_MODES } from "../utils"
import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import { currencyEnum, statusPlanEnum } from "./enums"
import { projects } from "./projects"

export const configFlatFeature = z.object({
  price: z.coerce.number().min(0),
  divider: z.coerce
    .number()
    .min(0)
    .describe("Divider for the price. Could be number of days, hours, etc."),
})

export const configTieredFeature = z
  .object({
    mode: z.enum(TIER_MODES),
    divider: z.coerce
      .number()
      .min(0)
      .describe("Divider for the price. Could be number of days, hours, etc."),
    tiers: z.array(
      z.object({
        price: z.coerce.number().min(0).describe("flat price for the tier"),
        first: z.coerce.number().min(0).describe("First unit for the tier"),
        last: z.coerce.number().min(0).describe("Last unit for the tier"),
      })
    ),
  })
  .refine(
    (data) => {
      // validate that the first and last are in order
      const tiers = data.tiers
      let tierId = 0

      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i]

        if (!tier) {
          continue
        }

        if (i === 0) {
          continue
        }

        const prevTier = tiers[i - 1]

        if (!prevTier) {
          continue
        }

        if (tier.first <= prevTier.last) {
          tierId = i
          return false
        }
      }

      return true
    },
    {
      message: "Tiers must be in order",
      path: [`config.tiers.0.first`],
    }
  )

export const configVolumeFeature = z
  .object({
    mode: z.enum(TIER_MODES),
    divider: z.coerce
      .number()
      .min(0)
      .describe("Divider for the price. Could be number of days, hours, etc."),
    tiers: z.array(
      z.object({
        price: z.coerce.number().min(0).describe("Price per unit"),
        first: z.coerce.number().min(0).describe("First unit for the volume"),
        last: z.coerce.number().min(0).describe("Last unit for the volume"),
      })
    ),
  })
  .refine(
    (data) => {
      // validate that the first and last are in order
      const tiers = data.tiers

      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i]

        if (!tier) {
          continue
        }

        if (i === 0) {
          continue
        }

        const prevTier = tiers[i - 1]

        if (!prevTier) {
          continue
        }

        if (tier.first <= prevTier.last) {
          return false
        }
      }

      return true
    },
    {
      message: "Tiers must be in order",
      path: ["config.tiers.0.first"],
    }
  )

export const planVersionFeatureSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    type: z.enum(FEATURE_TYPES).optional(),
    config: z
      .union([configFlatFeature, configTieredFeature, configVolumeFeature])
      .optional(),
  })
  .superRefine((data, _ctx) => {
    if (data.type === "flat") {
      configFlatFeature.parse(data.config)
    } else if (data.type === "tiered") {
      configTieredFeature.parse(data.config)
    } else if (data.type === "volume") {
      configVolumeFeature.parse(data.config)
    }
  })

export const plans = pgTableProject(
  "plans",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    title: varchar("title", { length: 50 }).notNull(),
    currency: currencyEnum("currency").default("EUR"),
    description: text("description"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plans_pkey",
    }),
    slug: uniqueIndex("slug_plan").on(table.slug, table.projectId),
  })
)

// TODO: intitlements should be a separate table

export const versions = pgTableProject(
  "plan_versions",
  {
    ...projectID,
    ...timestamps,
    planId: cuid("plan_id").notNull(),
    version: serial("version").notNull(),
    featuresConfig:
      json("features_config").$type<
        z.infer<typeof planVersionFeatureSchema>[]
      >(), // config features of the plan
    addonsConfig:
      json("addons_config").$type<z.infer<typeof planVersionFeatureSchema>[]>(), // config addons of the plan
    status: statusPlanEnum("plan_version_status").default("draft"),
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
    unique: uniqueIndex("unique_version").on(table.planId, table.version),
  })
)

// TODO: this table could have id as incremental so we can have a better performance
// also we can use binmanry to store the data in a more efficient way in redis
export const features = pgTableProject(
  "features",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    title: varchar("title", { length: 50 }).notNull(),
    description: text("description"),
    // type: typeFeatureEnum("type").default("flat").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id],
      name: "features_pkey",
    }),
    slug: uniqueIndex("slug_feature").on(table.slug, table.projectId),
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
