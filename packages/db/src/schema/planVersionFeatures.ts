import { relations } from "drizzle-orm"
import {
  doublePrecision,
  foreignKey,
  json,
  primaryKey,
  text,
  unique,
} from "drizzle-orm/pg-core"
import type * as z from "zod"

import { pgTableProject } from "../utils/_table"
import { cuid, projectID, timestamps } from "../utils/sql"
import type {
  configFeatureSchema,
  planVersionFeatureMetadataSchema,
} from "../validators"
import { paymentProviderEnum, typeFeatureEnum } from "./enums"
import { features } from "./features"
import { versions } from "./planVersions"
import { projects } from "./projects"

// this table can be seen as the products configuration that a plan version has and the user can subscribe to
// it has a provider and a priceId once the version of the plan is published
// the payment provider is the same as the one in the plan version
// we just add paymentProvider here because later on the user can subscribe to a set of features instead of the whole plan
export const planVersionFeatures = pgTableProject(
  "plan_versions_features",
  {
    ...projectID,
    ...timestamps,
    planVersionId: cuid("plan_version_id").notNull(),
    featureId: cuid("feature_id").notNull(),
    // type of the feature - flat, tier, usage, etc.
    featureType: typeFeatureEnum("feature_type").notNull(),
    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    paymentProvider: paymentProviderEnum("payment_providers")
      .default("stripe")
      .notNull(),
    // price Id of the payment provider for this feature
    priceId: text("price_id"),
    // configuration of the feature
    config:
      json("features_config").$type<z.infer<typeof configFeatureSchema>>(),
    // metadata probably will be useful to save external data, etc.
    metadata:
      json("metadata").$type<
        z.infer<typeof planVersionFeatureMetadataSchema>
      >(),
    order: doublePrecision("order").notNull(),
  },
  (table) => ({
    planversionfk: foreignKey({
      columns: [table.planVersionId, table.projectId],
      foreignColumns: [versions.id, versions.projectId],
      name: "plan_versions_id_fkey",
    }),
    featurefk: foreignKey({
      columns: [table.featureId, table.projectId],
      foreignColumns: [features.id, features.projectId],
      name: "features_id_fkey",
    }),
    pk: primaryKey({
      columns: [table.id, table.projectId],
      name: "plan_versions_pkey",
    }),
    // only one feature per plan version with the same order
    unique: unique("unique_version_feature")
      .on(table.planVersionId, table.featureId, table.projectId, table.order)
      .nullsNotDistinct(),
  })
)

export const planVersionFeatureRelations = relations(
  planVersionFeatures,
  ({ one }) => ({
    project: one(projects, {
      fields: [planVersionFeatures.projectId],
      references: [projects.id],
    }),
    planVersion: one(versions, {
      fields: [planVersionFeatures.planVersionId],
      references: [versions.id],
    }),
    feature: one(features, {
      fields: [planVersionFeatures.featureId],
      references: [features.id],
    }),
  })
)
