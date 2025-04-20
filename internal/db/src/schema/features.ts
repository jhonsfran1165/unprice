import { relations } from "drizzle-orm"
import { primaryKey, serial, text, uniqueIndex, varchar } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { timestamps } from "../utils/fields"
import { projectID } from "../utils/sql"
import { projects } from "./projects"

// features are the way we model our features in the system, after adding a feature to a plan we
// can add pricing configurations so the feature can be sold to the customers.
export const features = pgTableProject(
  "features",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    // TODO: add entitlements here so when the user wants to configure a plan version
    // we can check if the feature has entitlements and if so, we can add them to the plan version
    // code is the unique code for the feature that is used in redis cache for the entitlements calculation (bitmap)
    code: serial("code").notNull(),
    title: varchar("title", { length: 50 }).notNull(),
    description: text("description"),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.projectId, table.id],
      name: "features_pkey",
    }),
    slug: uniqueIndex("slug_feature").on(table.slug, table.projectId),
  })
)

export const featureRelations = relations(features, ({ one }) => ({
  project: one(projects, {
    fields: [features.projectId],
    references: [projects.id],
  }),
}))
