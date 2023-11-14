// TODO: export like this https://github.com/drizzle-team/drizzle-orm/issues/468
import { neonConfig, Pool } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"

import * as schema from "./schema"

export * from "drizzle-orm"
export * from "./rls"

// activate connection caching
neonConfig.fetchConnectionCache = true

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // idleTimeoutMillis: 0,
  // connectionTimeoutMillis: 0,
})

export const db = drizzleNeon(pool, {
  schema,
  logger: !!process.env.DATABASE_LOGGER,
})
