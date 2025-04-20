import { bigint, varchar } from "drizzle-orm/pg-core"

// easier to migrate to another db
export const cuid = (d: string) => varchar(d, { length: 36 })

// for workspace
export const id = {
  id: cuid("id").primaryKey().notNull(),
}

// for projects
export const workspaceID = {
  workspaceId: cuid("workspace_id").notNull(),
}

// common timestamps for all tables
// all dates are in UTC
export const timestamps = {
  createdAtM: bigint("created_at_m", { mode: "number" })
    .notNull()
    .default(0)
    .$defaultFn(() => Date.now()),
  updatedAtM: bigint("updated_at_m", { mode: "number" })
    .notNull()
    .default(0)
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now()),
}
