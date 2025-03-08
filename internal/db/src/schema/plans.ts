import { relations } from "drizzle-orm"
import { boolean, json, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"
import type { z } from "zod"

import { pgTableProject } from "../utils/_table"
import { timestamps } from "../utils/fields.sql"
import { projectID } from "../utils/sql"
import type { planMetadataSchema } from "../validators"
import { versions } from "./planVersions"
import { projects } from "./projects"

// plans are the different plans that a project can have - e.g. free, basic, premium
// it helps to group the different versions of the plan
export const plans = pgTableProject(
  "plans",
  {
    ...projectID,
    ...timestamps,
    slug: text("slug").notNull(),
    // whether the plan is active or not, if not active, it won't be available for purchase
    // this is useful for plans that are not available anymore so the api won't list them
    active: boolean("active").default(true),
    // description of the plan
    description: text("description").notNull(),
    // metadata probably will be useful to save external data, etc.
    metadata: json("metadata").$type<z.infer<typeof planMetadataSchema>>(),
    // whether this is the default plan for the project where all the users are subscribed by default
    // this is useful for the free plan
    // all users will fall back to this plan if they don't have a subscription or they downgrade their plan
    defaultPlan: boolean("default_plan").default(false),
    // whether this is an enterprise plan or not, enterprise plans are rendered differently in the frontend
    enterprisePlan: boolean("enterprise_plan").default(false),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plans_pkey",
    }),
    slug: uniqueIndex("slug_plan").on(table.slug, table.projectId),
  })
)

export const planRelations = relations(plans, ({ one, many }) => ({
  project: one(projects, {
    fields: [plans.projectId],
    references: [projects.id],
  }),
  versions: many(versions),
}))
