import { boolean, index, text, timestamp } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { id, tenantID, timestamps } from "../utils/sql"
import { plansEnum } from "./enums"

export const workspaces = pgTableProject(
  "workspaces",
  {
    ...id,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    name: text("name").notNull(),

    // the tenant id is the id of the user or organization that owns the workspace
    tenantId: text("tenant_id").unique().notNull(),

    // wether or not is a personal workspace - meaning asociated to a user or an organization
    isPersonal: boolean("is_personal").default(false),

    // stripe stuff
    stripeId: text("stripe_id").unique(),
    subscriptionId: text("subscription_id").unique(),
    // null means there was no trial
    trialEnds: timestamp("trial_ends", { mode: "string" }),
    // if null, you should fall back to start of month
    billingPeriodStart: timestamp("billing_period_start", { mode: "string" }),
    // if null, you should fall back to end of month
    billingPeriodEnd: timestamp("billing_period_end", { mode: "string" }),
    plan: plansEnum("legacy_plans").default("free").notNull(),
  },
  (table) => ({
    tenant: index("tenant").on(table.tenantId),
  })
)
