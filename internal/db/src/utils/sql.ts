import { sql } from "drizzle-orm"
import { timestamp, varchar } from "drizzle-orm/pg-core"
import { projects, workspaces } from "../schema"

// easier to migrate to another db
export const cuid = (d: string) => varchar(d, { length: 64 })

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

// common timestamps for all tables
// all dates are in UTC
export const timestamps = {
  // createdAt: bigint("created_at_m", { mode: "number" })
  // .notNull()
  // .default(0)
  // .$defaultFn(() => Date.now()),
  // updatedAt: bigint("updated_at_m", { mode: "number" }).$onUpdateFn(() => Date.now()),

  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
    precision: 3,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`)
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "date",
    withTimezone: true,
    precision: 3,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`)
    .defaultNow()
    .$onUpdateFn(() => {
      // convert to utc
      const date = new Date()
      date.setUTCDate(date.getDate())
      date.setUTCMonth(date.getMonth())
      date.setUTCFullYear(date.getFullYear())
      return date
    }),
}
