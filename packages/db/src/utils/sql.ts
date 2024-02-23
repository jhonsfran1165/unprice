import { text, timestamp } from "drizzle-orm/pg-core"

import { projects, workspaces } from "../schema"

// easier to migrate to another db
export const cuid = (d: string) => text(d)

// for workspace
export const id = {
  id: cuid("id").primaryKey().notNull(),
}

// for projects
export const workspaceID = {
  workspaceId: cuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
}

// for rest of tables
export const projectID = {
  get id() {
    return cuid("id").notNull()
  },
  get projectId() {
    return cuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" })
  },
}

// INFO: if you want update time on update, you can use this
// https://aviyadav231.medium.com/automatically-updating-a-timestamp-column-in-postgresql-using-triggers-98766e3b47a0
// common timestamps for all tables
export const timestamps = {
  createdAt: timestamp("created_at", {
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
  })
    .notNull()
    .defaultNow(),
}
