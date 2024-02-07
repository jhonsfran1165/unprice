import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { PLANS } from "@builderai/config"

import { id, tenantID, timestamps } from "../utils/sql"
import { plans } from "./enums"

export const workspace = pgTable(
  "workspace",
  {
    ...id,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    name: text("name"),

    tenantId: text("tenant_id").unique().notNull(),

    // wether or not is a personal workspace - meaning asociated to a user or an organization
    isPersonal: boolean("is_personal").default(false),

    // stripe stuff
    stripeId: text("stripe_id").unique(),
    subscriptionId: text("subscription_id").unique(),
    // null means there was no trial
    trialEnds: timestamp("trial_ends", { mode: "date" }),
    // if null, you should fall back to start of month
    billingPeriodStart: timestamp("billing_period_start", { mode: "date" }),
    // if null, you should fall back to end of month
    billingPeriodEnd: timestamp("billing_period_end", { mode: "date" }),
    plan: plans("plan").default(PLANS.FREE.key),
  },
  (table) => {
    return {
      workspaceSlugIdInx: uniqueIndex("workspace_slug_uidx").on(table.slug),
      workspaceStripeIdUInx: uniqueIndex("workspace_stripe_uidx").on(
        table.stripeId
      ),
      workspaceSubscriptionIdUInx: uniqueIndex(
        "workspace_subscription_uidx"
      ).on(table.subscriptionId),
      workspaceTenantIdUniqueInx: uniqueIndex("workspace_tenant_uidx").on(
        table.tenantId
      ),
    }
  }
)
