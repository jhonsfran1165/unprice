import { eq, relations } from "drizzle-orm"
import { bigint, boolean, foreignKey, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"
import { cuid, id, timestamps, workspaceID } from "../utils/fields.sql"
import { users } from "./auth"
import { teamRolesEnum } from "./enums"
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
    isInternal: boolean("is_internal").default(false),
    // there must be only one main workspace per the whole project
    isMain: boolean("is_main").default(false),
    createdBy: cuid("created_by")
      .notNull()
      .references(() => users.id),
    imageUrl: text("image_url"),

    // unprice id
    // in Postgres 15.0+ NULLS NOT DISTINCT is available
    unPriceCustomerId: text("unprice_customer_id").notNull().unique("unprice_customer_id"),

    // plan slug to show in the UI - this comes from unprice customer
    plan: text("plan"),

    /**
     * if the workspace is disabled, all API requests will be rejected
     */
    enabled: boolean("enabled").notNull().default(true),
  },
  (table) => ({
    mainWorkspace: uniqueIndex("main_workspace").on(table.isMain).where(eq(table.isMain, true)),
  })
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
    }).onDelete("cascade"),
    workspaceFk: foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspaces.id],
      name: "members_workspace_id_fkey",
    }).onDelete("cascade"),
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
    acceptedAt: bigint("accepted_at_m", { mode: "number" }),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.email, table.workspaceId],
      name: "invites_pkey",
    }),
    workspaceFk: foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspaces.id],
      name: "invites_workspace_id_fkey",
    }).onDelete("cascade"),
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
