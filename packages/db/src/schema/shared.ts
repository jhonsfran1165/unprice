import { text, timestamp } from "drizzle-orm/pg-core"

export const commonColumns = {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  // Coming from our auth provider clerk
  // This can be either a user_xxx or org_xxx id
  tenantId: text("tenant_id").notNull(),
}
