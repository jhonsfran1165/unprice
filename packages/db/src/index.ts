// TODO: export like this https://github.com/drizzle-team/drizzle-orm/issues/468
import { neonConfig, Pool } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless"

import * as rls from "./rls"
import * as dbSchemas from "./schema"
import * as utils from "./utils"

export * from "drizzle-orm"
export { rls, utils }
export const schema = { ...dbSchemas }

// activate connection caching
neonConfig.fetchConnectionCache = true

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // idleTimeoutMillis: 0,
  // connectionTimeoutMillis: 0,
})

export const db = drizzleNeon(pool, {
  schema: dbSchemas,
  logger: process.env.DRIZZLE_LOG === "true",
})
