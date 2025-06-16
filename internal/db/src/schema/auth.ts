import type { AdapterAccount } from "@auth/core/adapters"
import { relations } from "drizzle-orm"
import { boolean, integer, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core"

import { pgTableProject } from "../utils/_table"

import { cuid } from "../utils/fields"
import { members } from "./workspaces"

export const users = pgTableProject("user", {
  id: cuid("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  theme: text("theme").default("dark").notNull(),
  defaultWorkspaceSlug: text("default_wk_slug"),
  password: varchar("password", { length: 255 }), // nullable for Oauth users
})

export const accounts = pgTableProject(
  "account",
  {
    userId: cuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTableProject("session", {
  sessionToken: cuid("sessionToken").notNull().primaryKey(),
  userId: cuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTableProject(
  "verificationToken",
  {
    identifier: cuid("identifier").notNull(),
    token: cuid("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

export const authenticators = pgTableProject(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: cuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  members: many(members),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))
