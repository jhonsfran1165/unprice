import { index, integer, sqliteTable, sqliteTableCreator, text } from "drizzle-orm/sqlite-core"

export const version = "v1"

export const pgTableProject = sqliteTableCreator((name) => `${version}_${name}`)

export const usageRecords = sqliteTable(
  "usage_records",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    customerId: text().notNull(),
    featureSlug: text().notNull(),
    usage: integer().notNull(),
    timestamp: integer().notNull(),
  },
  (t) => [index("customer_id_index").on(t.customerId)]
)
