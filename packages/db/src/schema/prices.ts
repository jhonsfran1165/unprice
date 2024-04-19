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
import * as z from "zod"

import { FEATURE_TYPES, TIER_MODES } from "../utils"
import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import {
  currencyEnum,
  planBillingPeriodEnum,
  planTypeEnum,
  statusPlanEnum,
} from "./enums"
import { projects } from "./projects"
import { subscriptions } from "./subscriptions"

const typeFeatureSchema = z.enum(FEATURE_TYPES)

export type FeatureType = z.infer<typeof typeFeatureSchema>

export const configFlatFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.flat, {
    errorMap: () => ({ message: "Invalid configuration for the feature 1" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      // TODO: add priceId from stripe
      // paymentProviderPriceId -> external price ID
      price: z.coerce
        .number()
        .nonnegative()
        .min(0)
        .describe("Flat price of the feature"),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(0)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
    })
    .optional(),
})

export const configTieredFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.tiered, {
    errorMap: () => ({ message: "Invalid configuration for the feature 2" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      mode: z.enum(TIER_MODES),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(1)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
      tiers: z.array(
        z.object({
          price: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per unit"),
          first: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          last: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Last unit for the volume"),
        })
      ),
    })
    .optional()
    .superRefine((data, ctx) => {
      // validate that the first and last are in order

      data &&
        data.tiers.forEach((tier, i) => {
          if (tier.first >= tier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to have a valid range",
              path: ["tiers", i, "last"],
              fatal: true,
            })

            return false
          }

          const prevTier = i > 0 && data.tiers[i - 1]

          if (prevTier && tier.first <= prevTier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          } else if (prevTier && prevTier.last + 1 !== tier.first) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to be consecutive",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          }

          return true
        })
    }),
})

export const configVolumeFeature = z.object({
  type: z.literal(typeFeatureSchema.enum.volume, {
    errorMap: () => ({ message: "Invalid configuration for the feature 3" }),
  }),
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  config: z
    .object({
      mode: z.enum(TIER_MODES),
      divider: z.coerce
        .number()
        .nonnegative()
        .min(1)
        .describe(
          "Divider for the price. Could be number of days, hours, etc."
        ),
      tiers: z.array(
        z.object({
          price: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Price per unit"),
          first: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("First unit for the volume"),
          last: z.coerce
            .number()
            .nonnegative()
            .min(0)
            .describe("Last unit for the volume"),
        })
      ),
    })
    .optional()
    .superRefine((data, ctx) => {
      // validate that the first and last are in order

      data &&
        data.tiers.forEach((tier, i) => {
          if (tier.first >= tier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers need to have a valid range",
              path: ["tiers", i, "last"],
              fatal: true,
            })

            return false
          }

          const prevTier = i > 0 && data.tiers[i - 1]

          if (prevTier && tier.first <= prevTier.last) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tiers cannot overlap",
              path: ["tiers", i, "first"],
              fatal: true,
            })

            return false
          }

          return true
        })
    }),
})

export const planVersionFeatureSchema = z
  .discriminatedUnion("type", [
    configFlatFeature,
    configTieredFeature,
    configVolumeFeature,
  ])
  .superRefine((data, ctx) => {
    if (!data) {
      return
    }

    if (!data.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid configuration for the feature",
        path: ["type"],
        fatal: true,
      })

      return false
    }

    return true
  })

export const startCycleSchema = z.union([
  z.number().nonnegative(),
  z.literal("last_day"),
  z.null(),
])

type StartCycleType = z.infer<typeof startCycleSchema>

export const plans = pgTableProject(
  "plans",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    active: boolean("active").default(true),
    title: varchar("title", { length: 50 }).notNull(),
    currency: currencyEnum("currency").default("EUR"),
    type: planTypeEnum("plan_type").default("recurring"),
    // pay_in_advance
    // pay_in_arrear
    // payment provider configuration
    billingPeriod: planBillingPeriodEnum("billing_period").default("month"),
    startCycle: text("start_cycle").$type<StartCycleType>().default(null),
    gracePeriod: integer("grace_period").default(0),
    description: text("description"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plans_pkey",
    }),
    slug: unique("slug_plan").on(table.slug, table.projectId),
  })
)

// TODO: entitlements should be a separate table

export const versions = pgTableProject(
  "plan_versions",
  {
    ...projectID,
    ...timestamps,
    planId: cuid("plan_id").notNull(),
    version: integer("version").notNull(),
    latest: boolean("latest").default(false),
    // name for multi language

    // TODO: versions should be allow multiple currencies
    // currency: currencyEnum("currency").default("EUR"),
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
    unique: unique("unique_version").on(table.planId, table.version),
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
    slug: unique("slug_feature").on(table.slug, table.projectId),
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
