import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, id, tenantID, timestamps, workspaceID } from "../utils/sql"
import { users } from "./auth"
import { plansEnum, teamRolesEnum } from "./enums"
import { projects } from "./projects"

export const workspaces = pgTableProject(
  "workspaces",
  {
    ...id,
    ...tenantID,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    name: text("name").notNull(),

    // the tenant id is the id of the user or organization that owns the workspace
    tenantId: text("tenant_id").unique().notNull(), // TODO: delete this

    // wether or not is a personal workspace - meaning asociated to a user or a team
    isPersonal: boolean("is_personal").default(false),

    imageUrl: text("image_url"),
    // stripe stuff
    stripeId: text("stripe_id").unique(),
    // TODO: this should be in the project table and not here
    // a workspace can have multiple projects and each project can have a different plan
    // workspaces with subscribed projects will have a plan tag here to differentiate them so we can show the right features in the UI
    // plan: plansEnum("legacy_plans").default("free").notNull(),
    subscriptionId: cuid("subscription_id").unique(),
    // null means there was no trial
    trialEnds: timestamp("trial_ends", { mode: "date" }),
    // if null, you should fall back to start of month
    billingPeriodStart: timestamp("billing_period_start", { mode: "date" }),
    // if null, you should fall back to end of month
    billingPeriodEnd: timestamp("billing_period_end", { mode: "date" }),
    plan: plansEnum("legacy_plans").default("free").notNull(),
  },
  (table) => ({
    tenant: index("tenant").on(table.tenantId),
  })
)

// TODO: members_workspaces
export const members = pgTableProject(
  "members",
  {
    ...timestamps,
    ...workspaceID,
    userId: cuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamRolesEnum("role").default("MEMBER").notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.userId, table.workspaceId, table.role],
    }),
  })
)

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  usersToWorkspaces: many(members),
  projects: many(projects),
}))

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [members.workspaceId],
    references: [workspaces.id],
  }),
}))
