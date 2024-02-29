import { relations } from "drizzle-orm"
import { boolean, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, id, timestamps, workspaceID } from "../utils/sql"
import { users } from "./auth"
import { plansEnum, teamRolesEnum } from "./enums"
import { projects } from "./projects"

export const workspaces = pgTableProject(
  "workspaces",
  {
    ...id,
    ...timestamps,
    slug: text("slug").notNull().unique(), // we love random words
    name: text("name").notNull(),

    // wether or not is a personal workspace - meaning asociated to a user or a team
    isPersonal: boolean("is_personal").default(false),
    createdBy: cuid("created_by")
      .notNull()
      .references(() => users.id),
    imageUrl: text("image_url"),
    // stripe stuff
    stripeId: text("stripe_id").unique(),
    // TODO: define the way subscriptions will work
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
    plan: plansEnum("legacy_plans").default("FREE").notNull(),
  },
  (_table) => ({})
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
      columns: [table.userId, table.workspaceId],
      name: "members_pkey",
    }),
  })
)

export const invites = pgTableProject(
  "invites",
  {
    ...timestamps,
    ...workspaceID,
    email: text("email").notNull(),
    role: teamRolesEnum("role").default("MEMBER").notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.email, table.workspaceId],
      name: "invites_pkey",
    }),
  })
)

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  createdBy: one(users, {
    fields: [workspaces.createdBy],
    references: [users.id],
  }),
  members: many(members),
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
