import { relations } from "drizzle-orm"
import {
  boolean,
  foreignKey,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

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

    // unprice id
    // in Postgres 15.0+ NULLS NOT DISTINCT is available
    unPriceCustomerId: text("unprice_customer_id").unique(
      "unprice_customer_id",
      { nulls: "not distinct" }
    ),

    // TODO: remove this
    plan: plansEnum("legacy_plans").default("FREE").notNull(),

    /**
     * if the workspace is disabled, all API requests will be rejected
     */
    enabled: boolean("enabled").notNull().default(true),
  },
  (_table) => ({})
)

export const members = pgTableProject(
  "members",
  {
    ...timestamps,
    ...workspaceID,
    userId: cuid("user_id").notNull(),
    role: teamRolesEnum("role").default("MEMBER").notNull(),
  },
  (table) => ({
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "members_user_id_fkey",
    }),
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
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
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
