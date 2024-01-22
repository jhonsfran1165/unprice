import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { MEMBERSHIP, PLANS } from "@builderai/config"

import { plans } from "../utils/enums"
import { id, tenantID, timestamps } from "../utils/sql"

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
    plans: plans("plans").default(PLANS.FREE.key),
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

export const inviteOrgMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MEMBERSHIP),
})

export const purchaseWorkspaceSchema = z.object({
  orgName: z.string().min(5, "Name must be at least 5 characters"),
  planId: z.string().refine(
    (str) =>
      Object.values(PLANS)
        .map((p) => p.priceId ?? "")
        .includes(str),
    "Invalid planId"
  ),
})

export const selectWorkspaceSchema = createSelectSchema(workspace)

export type PurchaseOrg = z.infer<typeof purchaseWorkspaceSchema>
export type SelectWorkspace = z.infer<typeof selectWorkspaceSchema>
export type InviteOrgMember = z.infer<typeof inviteOrgMemberSchema>
