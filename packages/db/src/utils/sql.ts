import { sql } from "drizzle-orm"
import { text, timestamp } from "drizzle-orm/pg-core"

export const cuid = (d: string) => text(d)

// for workspace
export const id = {
  id: cuid("id").primaryKey().notNull(),
}

// for projects
export const workspaceID = {
  get id() {
    return cuid("id").primaryKey().notNull()
  },
  get workspaceId() {
    return cuid("workspace_id").notNull()
  },
}

// for rest of tables
export const projectID = {
  get id() {
    return cuid("id").primaryKey().notNull()
  },
  get projectId() {
    return cuid("project_id").notNull().notNull()
  },
}

// override tenant ID here because in workspace tenantId has to be unique
// so we have a 1:1 relationship with clerk data
export const tenantID = {
  tenantId: cuid("tenant_id").notNull(),
}

// common timestamps for all tables
export const timestamps = {
  createdAt: timestamp("created_at", {
    mode: "string",
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", {
    mode: "string",
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}
