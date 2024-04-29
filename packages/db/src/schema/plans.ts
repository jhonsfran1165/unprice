import { relations } from "drizzle-orm"
import { boolean, primaryKey, text, unique } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { projectID, timestamps } from "../utils/sql"
import { paymentProviderEnum, planTypeEnum } from "./enums"
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
    // payment provider for the plan - stripe, paypal, lemonsquezee etc.
    paymentProvider: paymentProviderEnum("payment_providers")
      .default("stripe")
      .notNull(),
    // description of the plan
    description: text("description"),
    // type of the plan - recurring, one-time, etc.
    // TODO: add more types for now only support recurring
    type: planTypeEnum("plan_type").default("recurring").notNull(),
  },
  (table) => ({
    primary: primaryKey({
      columns: [table.id, table.projectId],
      name: "plans_pkey",
    }),
    slug: unique("slug_plan").on(table.slug, table.projectId),
  })
)

export const planRelations = relations(plans, ({ one, many }) => ({
  project: one(projects, {
    fields: [plans.projectId],
    references: [projects.id],
  }),
  versions: many(versions),
}))
