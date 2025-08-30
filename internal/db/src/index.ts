import type { Pool } from "@neondatabase/serverless"
import type { NeonDatabase } from "drizzle-orm/neon-serverless"
import type { PgWithReplicas } from "drizzle-orm/pg-core"
import type * as schema from "./schema"

export * from "drizzle-orm"
export { pgTableProject as tableCreator } from "./utils"
export type Database = PgWithReplicas<
  NeonDatabase<typeof schema> & {
    $client: Pool
  }
>
export type TransactionDatabase = Parameters<Parameters<Database["transaction"]>[0]>[0]
export { createConnection } from "./createConnection"
